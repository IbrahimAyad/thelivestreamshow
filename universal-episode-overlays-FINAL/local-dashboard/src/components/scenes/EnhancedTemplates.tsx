import React from 'react';
import { useScene } from '../../contexts/SceneContext';
import toast from 'react-hot-toast';
import { Layout, Grid3x3, Users, Smartphone, MonitorPlay, Triangle, PictureInPicture2, Newspaper } from 'lucide-react';

// New professional scene templates
export const ENHANCED_TEMPLATES = [
  {
    id: 'news-desk',
    name: 'News Desk',
    description: 'Professional news style with ticker space',
    icon: Newspaper,
    gradient: 'from-cyan-500 to-blue-600',
    layout: 'Main anchor center with lower ticker area',
  },
  {
    id: 'podcast-studio',
    name: 'Podcast Studio',
    description: '2-4 person horizontal layout',
    icon: Users,
    gradient: 'from-purple-500 to-pink-600',
    layout: 'Horizontal multi-person grid',
  },
  {
    id: 'sports-panel',
    name: 'Sports Panel',
    description: 'Multiple cameras with stats overlay area',
    icon: Grid3x3,
    gradient: 'from-green-500 to-emerald-600',
    layout: 'Multi-cam with dedicated stats zone',
  },
  {
    id: 'vertical-mobile',
    name: 'Vertical Mobile',
    description: '9:16 for mobile-first content',
    icon: Smartphone,
    gradient: 'from-orange-500 to-red-600',
    layout: 'Portrait orientation optimized',
  },
  {
    id: 'side-by-side',
    name: 'Side-by-Side Compare',
    description: 'Dual content comparison',
    icon: MonitorPlay,
    gradient: 'from-indigo-500 to-purple-600',
    layout: 'Two equal content areas',
  },
  {
    id: 'three-shot',
    name: 'Three-Shot',
    description: 'Host + 2 guests triangular arrangement',
    icon: Triangle,
    gradient: 'from-yellow-500 to-orange-600',
    layout: 'Triangular 3-person layout',
  },
];

// PIP size and position variants
export const PIP_VARIANTS = [
  { id: 'pip-small-br', name: 'Small - Bottom Right', size: 'small', position: 'bottom-right' },
  { id: 'pip-small-bl', name: 'Small - Bottom Left', size: 'small', position: 'bottom-left' },
  { id: 'pip-small-tr', name: 'Small - Top Right', size: 'small', position: 'top-right' },
  { id: 'pip-small-tl', name: 'Small - Top Left', size: 'small', position: 'top-left' },
  { id: 'pip-medium-br', name: 'Medium - Bottom Right', size: 'medium', position: 'bottom-right' },
  { id: 'pip-medium-bl', name: 'Medium - Bottom Left', size: 'medium', position: 'bottom-left' },
  { id: 'pip-medium-tr', name: 'Medium - Top Right', size: 'medium', position: 'top-right' },
  { id: 'pip-medium-tl', name: 'Medium - Top Left', size: 'medium', position: 'top-left' },
  { id: 'pip-large-br', name: 'Large - Bottom Right', size: 'large', position: 'bottom-right' },
  { id: 'pip-large-bl', name: 'Large - Bottom Left', size: 'large', position: 'bottom-left' },
  { id: 'pip-center', name: 'Center Overlay', size: 'large', position: 'center' },
];

interface EnhancedTemplatesProps {
  category?: 'all' | 'new' | 'pip-variants';
}

const EnhancedTemplates: React.FC<EnhancedTemplatesProps> = ({ category = 'all' }) => {
  const { applyScene } = useScene();

  const handleTemplateClick = async (templateId: string, templateName: string) => {
    toast.loading('Applying template...', { id: 'template' });
    
    try {
      // For now, these templates will use placeholder configurations
      // In production, these would be loaded from the database
      const config = {
        sources: [],
        templateType: templateId,
      };
      
      await applyScene(templateId, templateName, config);
      toast.success(`${templateName} template applied!`, { id: 'template' });
    } catch (error) {
      console.error('Template application failed:', error);
      toast.error('Failed to apply template', { id: 'template' });
    }
  };

  const showNewTemplates = category === 'all' || category === 'new';
  const showPIPVariants = category === 'all' || category === 'pip-variants';

  return (
    <div className="space-y-8">
      {/* New Professional Templates */}
      {showNewTemplates && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Professional Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ENHANCED_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template.id, template.name)}
                className="group relative overflow-hidden rounded-lg border-2 border-gray-700 hover:border-blue-500 transition-all duration-300 hover:scale-105"
              >
                <div className={`bg-gradient-to-br ${template.gradient} p-6 h-32 flex items-center justify-center`}>
                  <template.icon className="w-12 h-12 text-white" />
                </div>
                <div className="bg-[#2a2a2a] p-4">
                  <h4 className="text-white font-semibold mb-1">{template.name}</h4>
                  <p className="text-gray-400 text-sm mb-2">{template.description}</p>
                  <p className="text-gray-500 text-xs">{template.layout}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PIP Variants */}
      {showPIPVariants && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Picture-in-Picture Variants</h3>
          <p className="text-gray-400 text-sm mb-4">
            Choose the perfect size and position for your webcam overlay
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {PIP_VARIANTS.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleTemplateClick(variant.id, variant.name)}
                className="group relative bg-[#2a2a2a] border-2 border-gray-700 hover:border-purple-500 rounded-lg p-4 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center justify-center mb-2">
                  <PictureInPicture2 className="w-8 h-8 text-purple-400" />
                </div>
                <h4 className="text-white font-medium text-sm text-center">{variant.name}</h4>
                <p className="text-gray-500 text-xs text-center mt-1 capitalize">
                  {variant.size}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTemplates;
