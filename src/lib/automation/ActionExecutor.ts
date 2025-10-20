// =====================================================
// ACTION EXECUTOR - Safely executes automation actions
// =====================================================

import { supabase } from '../supabase'
import type { ObsController } from '../obs/ObsController'
import type {
  ActionType,
  ActionResult,
  BetaBotMoodAction,
  BetaBotMovementAction,
  ObsSceneAction,
  ObsSourceAction,
  GraphicAction,
  QuestionIndicatorAction,
  SegmentAction,
  LowerThirdAction
} from './types'

export class ActionExecutor {
  private dryRun: boolean = false
  private obsController: ObsController | null = null // Will be injected if OBS is enabled

  constructor(dryRun: boolean = false) {
    this.dryRun = dryRun
  }

  /**
   * Set OBS controller for OBS-related actions
   */
  setObsController(controller: ObsController | null) {
    this.obsController = controller
  }

  /**
   * Enable/disable dry-run mode (log only, don't execute)
   */
  setDryRun(enabled: boolean) {
    this.dryRun = enabled
  }

  /**
   * Execute an automation action
   */
  async execute(actionType: ActionType, actionData: Record<string, any>): Promise<ActionResult> {
    const startTime = Date.now()

    try {
      if (this.dryRun) {
        console.log('[DRY RUN] Would execute:', actionType, actionData)
        return {
          success: true,
          actionType,
          executionTimeMs: Date.now() - startTime,
          metadata: { dryRun: true }
        }
      }

      // Route to appropriate handler
      switch (actionType) {
        case 'betabot.mood':
          return await this.executeBetaBotMood(actionData as BetaBotMoodAction, startTime)

        case 'betabot.movement':
          return await this.executeBetaBotMovement(actionData as BetaBotMovementAction, startTime)

        case 'obs.scene':
          return await this.executeObsScene(actionData as ObsSceneAction, startTime)

        case 'obs.source.show':
        case 'obs.source.hide':
          return await this.executeObsSource(actionData as ObsSourceAction, actionType === 'obs.source.show', startTime)

        case 'graphic.show':
        case 'graphic.hide':
          return await this.executeGraphic(actionData as GraphicAction, actionType === 'graphic.show', startTime)

        case 'question.indicate':
          return await this.executeQuestionIndicator(actionData as QuestionIndicatorAction, startTime)

        case 'segment.switch':
          return await this.executeSegmentSwitch(actionData as SegmentAction, startTime)

        case 'lower_third.show':
        case 'lower_third.hide':
          return await this.executeLowerThird(actionData as LowerThirdAction, actionType === 'lower_third.show', startTime)

        default:
          throw new Error(`Unknown action type: ${actionType}`)
      }
    } catch (error) {
      return {
        success: false,
        actionType,
        executionTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // ACTION HANDLERS
  // =====================================================

  /**
   * BetaBot Mood - Update mood and intensity
   */
  private async executeBetaBotMood(data: BetaBotMoodAction, startTime: number): Promise<ActionResult> {
    const { mood, intensity = 5 } = data

    await supabase
      .from('betabot_mood')
      .update({
        mood,
        intensity,
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')

    return {
      success: true,
      actionType: 'betabot.mood',
      executionTimeMs: Date.now() - startTime,
      metadata: { mood, intensity }
    }
  }

  /**
   * BetaBot Movement - Update movement state
   */
  private async executeBetaBotMovement(data: BetaBotMovementAction, startTime: number): Promise<ActionResult> {
    const { movement } = data

    await supabase
      .from('betabot_mood')
      .update({
        movement,
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')

    return {
      success: true,
      actionType: 'betabot.movement',
      executionTimeMs: Date.now() - startTime,
      metadata: { movement }
    }
  }

  /**
   * OBS Scene Switch
   */
  private async executeObsScene(data: ObsSceneAction, startTime: number): Promise<ActionResult> {
    if (!this.obsController) {
      throw new Error('OBS controller not initialized')
    }

    if (!this.obsController.isConnected) {
      throw new Error('OBS not connected')
    }

    const { sceneName, transition, transitionDuration } = data

    await this.obsController.switchScene(sceneName, transition, transitionDuration)

    return {
      success: true,
      actionType: 'obs.scene',
      executionTimeMs: Date.now() - startTime,
      metadata: { sceneName, transition }
    }
  }

  /**
   * OBS Source Show/Hide
   */
  private async executeObsSource(data: ObsSourceAction, show: boolean, startTime: number): Promise<ActionResult> {
    if (!this.obsController) {
      throw new Error('OBS controller not initialized')
    }

    if (!this.obsController.isConnected) {
      throw new Error('OBS not connected')
    }

    const { sourceName, sceneName } = data

    await this.obsController.toggleSource(sourceName, show, sceneName)

    return {
      success: true,
      actionType: show ? 'obs.source.show' : 'obs.source.hide',
      executionTimeMs: Date.now() - startTime,
      metadata: { sourceName, sceneName, visible: show }
    }
  }

  /**
   * Graphic Show/Hide
   */
  private async executeGraphic(data: GraphicAction, show: boolean, startTime: number): Promise<ActionResult> {
    const { graphic_type, graphic_id } = data

    // If specific graphic ID provided, update that one
    if (graphic_id) {
      await supabase
        .from('broadcast_graphics')
        .update({
          is_visible: show,
          updated_at: new Date().toISOString()
        })
        .eq('id', graphic_id)
    } else {
      // Otherwise find by type
      const { data: graphics } = await supabase
        .from('broadcast_graphics')
        .select('id')
        .eq('graphic_type', graphic_type)
        .limit(1)

      if (graphics && graphics[0]) {
        await supabase
          .from('broadcast_graphics')
          .update({
            is_visible: show,
            updated_at: new Date().toISOString()
          })
          .eq('id', graphics[0].id)
      }
    }

    return {
      success: true,
      actionType: show ? 'graphic.show' : 'graphic.hide',
      executionTimeMs: Date.now() - startTime,
      metadata: { graphic_type, graphic_id, visible: show }
    }
  }

  /**
   * Question Indicator - Show incoming question indicator
   */
  private async executeQuestionIndicator(data: QuestionIndicatorAction, startTime: number): Promise<ActionResult> {
    const { show, question_id } = data

    // Find or create question indicator graphic
    const { data: indicator } = await supabase
      .from('broadcast_graphics')
      .select('id')
      .eq('graphic_type', 'question_indicator')
      .limit(1)

    if (indicator && indicator[0]) {
      await supabase
        .from('broadcast_graphics')
        .update({
          is_visible: show,
          updated_at: new Date().toISOString()
        })
        .eq('id', indicator[0].id)
    }

    return {
      success: true,
      actionType: 'question.indicate',
      executionTimeMs: Date.now() - startTime,
      metadata: { show, question_id }
    }
  }

  /**
   * Segment Switch - Change active show segment
   */
  private async executeSegmentSwitch(data: SegmentAction, startTime: number): Promise<ActionResult> {
    const { segment_id } = data

    // Deactivate all segments
    await supabase
      .from('show_segments')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    // Activate selected segment
    await supabase
      .from('show_segments')
      .update({ is_active: true })
      .eq('id', segment_id)

    return {
      success: true,
      actionType: 'segment.switch',
      executionTimeMs: Date.now() - startTime,
      metadata: { segment_id }
    }
  }

  /**
   * Lower Third Show/Hide
   */
  private async executeLowerThird(data: LowerThirdAction, show: boolean, startTime: number): Promise<ActionResult> {
    const { lower_third_id, duration } = data

    await supabase
      .from('lower_thirds')
      .update({
        is_visible: show,
        updated_at: new Date().toISOString()
      })
      .eq('id', lower_third_id)

    // If showing with duration, auto-hide after duration
    if (show && duration) {
      setTimeout(async () => {
        await supabase
          .from('lower_thirds')
          .update({
            is_visible: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', lower_third_id)
      }, duration * 1000)
    }

    return {
      success: true,
      actionType: show ? 'lower_third.show' : 'lower_third.hide',
      executionTimeMs: Date.now() - startTime,
      metadata: { lower_third_id, duration }
    }
  }
}
