import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UltraChatModal } from '../components/UltraChatModal'
import { LatestEpisodes, LatestShorts } from '../components/LatestEpisodes'

export function LandingPage() {
  const [isUltraChatOpen, setIsUltraChatOpen] = useState(false)
  useEffect(() => {
    // Navigation scroll effect
    const nav = document.getElementById('nav')
    const handleScroll = () => {
      if (window.scrollY > 50) {
        nav?.classList.add('scrolled')
      } else {
        nav?.classList.remove('scrolled')
      }
    }
    window.addEventListener('scroll', handleScroll)

    // Scroll reveal animations
    const revealElements = document.querySelectorAll('.reveal')
    const revealOnScroll = () => {
      revealElements.forEach(el => {
        const elementTop = el.getBoundingClientRect().top
        const windowHeight = window.innerHeight
        if (elementTop < windowHeight - 100) {
          el.classList.add('active')
        }
      })
    }
    window.addEventListener('scroll', revealOnScroll)
    revealOnScroll()

    // Parallax effect on hero glows
    const handleMouseMove = (e: MouseEvent) => {
      const glows = document.querySelectorAll('.hero-glow')
      const x = (e.clientX / window.innerWidth - 0.5) * 30
      const y = (e.clientY / window.innerHeight - 0.5) * 30
      glows.forEach((glow, i) => {
        const factor = i === 0 ? 1 : -1
        ;(glow as HTMLElement).style.transform = `translate(${x * factor}px, ${y * factor}px)`
      })
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Intersection Observer for stats animation
    const statsSection = document.querySelector('.stats-bar')
    let statsAnimated = false
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !statsAnimated) {
          statsAnimated = true
          const statNumbers = document.querySelectorAll('.stat-number')
          statNumbers.forEach(stat => {
            const text = stat.textContent || ''
            if (text.includes('+')) {
              const num = parseInt(text)
              let start = 0
              const increment = num / 125
              const updateCounter = () => {
                start += increment
                if (start < num) {
                  stat.textContent = Math.floor(start) + '+'
                  requestAnimationFrame(updateCounter)
                } else {
                  stat.textContent = num + '+'
                }
              }
              updateCounter()
            }
          })
        }
      })
    }, { threshold: 0.5 })
    if (statsSection) statsObserver.observe(statsSection)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', revealOnScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      if (statsSection) statsObserver.unobserve(statsSection)
    }
  }, [])

  return (
    <>
      {/* SEO Meta Tags */}
      <title>The Live Stream Show | Purposeful Illusion</title>
      <meta name="description" content="The Live Stream Show - Purposeful Illusion. Live debates, morning shows, gaming streams, and unfiltered conversations. Season 4 now streaming." />
      <meta property="og:title" content="The Live Stream Show | Purposeful Illusion" />
      <meta property="og:description" content="Where entertainment meets innovation. Live debates, morning shows, gaming streams." />
      <meta property="og:url" content="https://thelivestreamshow.com" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="The Live Stream Show" />
      <meta name="twitter:description" content="Purposeful Illusion - Season 4 Now Streaming" />

      <style>{`
        :root {
          --bg-deep: #0a0e17;
          --bg-surface: #111827;
          --bg-elevated: #1e293b;
          --accent-primary: #06b6d4;
          --accent-secondary: #8b5cf6;
          --accent-warm: #f59e0b;
          --text-primary: #f8fafc;
          --text-secondary: #94a3b8;
          --text-muted: #64748b;
          --gradient-hero: linear-gradient(135deg, #0a0e17 0%, #1a1f35 50%, #0f172a 100%);
          --gradient-accent: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          --gradient-warm: linear-gradient(135deg, var(--accent-warm), #ef4444);
        }

        body.landing-page {
          font-family: 'Space Grotesk', sans-serif;
          background: var(--bg-deep);
          color: var(--text-primary);
          overflow-x: hidden;
          line-height: 1.6;
        }

        .noise-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 1.5rem 4rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(10, 14, 23, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(6, 182, 212, 0.1);
          transition: all 0.3s ease;
        }

        .nav.scrolled {
          padding: 1rem 4rem;
          background: rgba(10, 14, 23, 0.95);
        }

        .logo {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          background: var(--gradient-accent);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links {
          display: flex;
          gap: 3rem;
          list-style: none;
        }

        .nav-links a {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: color 0.3s ease;
          position: relative;
        }

        .nav-links a::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--gradient-accent);
          transition: width 0.3s ease;
        }

        .nav-links a:hover {
          color: var(--text-primary);
        }

        .nav-links a:hover::after {
          width: 100%;
        }

        .nav-cta {
          padding: 0.75rem 2rem;
          background: var(--gradient-accent);
          border: none;
          border-radius: 50px;
          color: var(--bg-deep);
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
          text-decoration: none;
          display: inline-block;
        }

        .nav-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(6, 182, 212, 0.4);
        }

        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          padding: 8rem 4rem 4rem;
          background: var(--gradient-hero);
          overflow: hidden;
        }

        .hero-bg-grid {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }

        .hero-glow {
          position: absolute;
          width: 800px;
          height: 800px;
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.15;
          animation: glowPulse 8s ease-in-out infinite;
        }

        .hero-glow-1 {
          top: -200px;
          right: -200px;
          background: var(--accent-primary);
        }

        .hero-glow-2 {
          bottom: -200px;
          left: -200px;
          background: var(--accent-secondary);
          animation-delay: -4s;
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.1); }
        }

        .hero-content {
          position: relative;
          z-index: 10;
          text-align: center;
          max-width: 1000px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.5rem;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.3);
          border-radius: 50px;
          font-size: 0.85rem;
          color: var(--accent-primary);
          margin-bottom: 2rem;
          animation: fadeInUp 0.8s ease-out;
        }

        .hero-badge-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-primary);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(3.5rem, 10vw, 8rem);
          font-weight: 800;
          line-height: 0.95;
          margin-bottom: 1.5rem;
          animation: fadeInUp 0.8s ease-out 0.1s both;
        }

        .hero-title-line {
          display: block;
        }

        .hero-title-gradient {
          background: var(--gradient-accent);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-tagline {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(1.5rem, 4vw, 2.5rem);
          letter-spacing: 0.3em;
          color: var(--text-muted);
          margin-bottom: 2rem;
          animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        .hero-description {
          font-size: 1.25rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto 3rem;
          animation: fadeInUp 0.8s ease-out 0.3s both;
        }

        .hero-actions {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          flex-wrap: wrap;
          animation: fadeInUp 0.8s ease-out 0.4s both;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 2.5rem;
          background: var(--gradient-accent);
          border: none;
          border-radius: 50px;
          color: var(--bg-deep);
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 40px rgba(6, 182, 212, 0.5);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 2.5rem;
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 50px;
          color: var(--text-primary);
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          border-color: var(--accent-primary);
          background: rgba(6, 182, 212, 0.1);
        }

        .hero-scroll-indicator {
          position: absolute;
          bottom: 3rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          animation: bounce 2s ease-in-out infinite;
        }

        .scroll-line {
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, var(--accent-primary), transparent);
        }

        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(10px); }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stats-bar {
          background: var(--bg-surface);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 3rem 4rem;
        }

        .stats-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }

        .stat-item {
          text-align: center;
          position: relative;
        }

        .stat-item:not(:last-child)::after {
          content: '';
          position: absolute;
          right: -1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1px;
          height: 60%;
          background: rgba(255, 255, 255, 0.1);
        }

        .stat-number {
          font-family: 'Syne', sans-serif;
          font-size: 3rem;
          font-weight: 800;
          background: var(--gradient-accent);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .stat-label {
          color: var(--text-muted);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 0.5rem;
        }

        .section-header {
          text-align: center;
          margin-bottom: 5rem;
        }

        .section-label {
          font-size: 0.85rem;
          color: var(--accent-primary);
          text-transform: uppercase;
          letter-spacing: 0.2em;
          margin-bottom: 1rem;
        }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800;
          margin-bottom: 1.5rem;
        }

        .section-subtitle {
          color: var(--text-secondary);
          font-size: 1.2rem;
          max-width: 600px;
          margin: 0 auto;
        }

        /* About Section */
        .about {
          padding: 8rem 4rem;
          position: relative;
          overflow: hidden;
        }

        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          max-width: 1200px;
          margin: 0 auto;
          align-items: center;
        }

        .about-visual {
          position: relative;
          aspect-ratio: 4/3;
          background: var(--bg-elevated);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .about-visual-inner {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.2), transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.2), transparent 50%);
        }

        .about-game-link {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          text-decoration: none;
          cursor: pointer;
        }

        .about-game-character {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
          filter: drop-shadow(0 20px 40px rgba(139, 92, 246, 0.5));
        }

        .about-game-link:hover .about-game-character {
          transform: scale(1.05);
        }

        .about-game-overlay {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          padding: 1rem 2rem;
          border-radius: 50px;
          border: 2px solid rgba(139, 92, 246, 0.5);
          transition: all 0.3s ease;
        }

        .about-game-link:hover .about-game-overlay {
          background: var(--gradient-accent);
          border-color: transparent;
          box-shadow: 0 10px 40px rgba(6, 182, 212, 0.6);
        }

        .about-game-badge {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          color: white;
          letter-spacing: 0.5px;
        }

        .about-play-icon {
          width: 24px;
          height: 24px;
          fill: white;
        }

        .about-content h3 {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          margin-bottom: 1.5rem;
        }

        .about-content p {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
        }

        .about-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 2rem;
        }

        .about-feature {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-secondary);
        }

        .about-feature-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(6, 182, 212, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .about-feature-icon svg {
          width: 12px;
          height: 12px;
          stroke: var(--accent-primary);
          stroke-width: 3;
          fill: none;
        }

        /* Game Showcase Section */
        .game-showcase {
          position: relative;
          padding: 8rem 4rem;
          background: linear-gradient(135deg, #0a0e17 0%, #1a1f35 50%, #0a0e17 100%);
          overflow: hidden;
        }

        .game-showcase-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 30%, rgba(255, 215, 0, 0.08), transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.12), transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.06), transparent 60%);
          pointer-events: none;
        }

        .game-showcase-container {
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6rem;
          align-items: center;
        }

        .game-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.25rem;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2));
          border: 1px solid rgba(255, 215, 0, 0.4);
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #FFD700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 2rem;
        }

        .game-badge-icon {
          width: 16px;
          height: 16px;
        }

        .game-title {
          font-family: 'Syne', sans-serif;
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .game-title-top {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #FFD700, #FFA500);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 0.5rem;
        }

        .game-title-main {
          font-size: 4.5rem;
          font-weight: 900;
          color: white;
          letter-spacing: 0.3rem;
          margin-top: 0.5rem;
          text-shadow: 0 0 40px rgba(255, 215, 0, 0.3);
        }

        .game-title-13 {
          background: linear-gradient(135deg, #FFD700, #FF8C00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 20px rgba(255, 140, 0, 0.6));
        }

        .game-tagline {
          font-size: 1.5rem;
          color: var(--accent-primary);
          font-weight: 600;
          margin-bottom: 1.5rem;
          font-style: italic;
        }

        .game-description {
          font-size: 1.1rem;
          color: var(--text-secondary);
          line-height: 1.8;
          margin-bottom: 3rem;
        }

        .game-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .game-feature-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 215, 0, 0.15);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .game-feature-item:hover {
          background: rgba(255, 215, 0, 0.08);
          border-color: rgba(255, 215, 0, 0.3);
          transform: translateY(-2px);
        }

        .game-feature-icon {
          font-size: 2rem;
          filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.4));
        }

        .game-feature-title {
          font-weight: 700;
          color: white;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }

        .game-feature-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .game-cta-button {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 3rem;
          background: linear-gradient(135deg, #FFD700, #FF8C00);
          border: none;
          border-radius: 50px;
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 800;
          color: #0a0e17;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow:
            0 10px 40px rgba(255, 215, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          position: relative;
          overflow: hidden;
        }

        .game-cta-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .game-cta-button:hover::before {
          transform: translateX(100%);
        }

        .game-cta-button:hover {
          transform: translateY(-2px);
          box-shadow:
            0 15px 50px rgba(255, 215, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .game-cta-arrow {
          width: 20px;
          height: 20px;
          transition: transform 0.3s ease;
        }

        .game-cta-button:hover .game-cta-arrow {
          transform: translateX(5px);
        }

        .game-disclaimer {
          margin-top: 1.5rem;
          font-size: 0.9rem;
          color: var(--text-muted);
          font-style: italic;
        }

        .game-showcase-visual {
          position: relative;
        }

        .game-visual-frame {
          position: relative;
          aspect-ratio: 1;
          border-radius: 20px;
          background:
            linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(139, 92, 246, 0.1));
          padding: 2rem;
          border: 2px solid rgba(255, 215, 0, 0.3);
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .game-visual-glow {
          position: absolute;
          inset: -20px;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.2), transparent 70%);
          filter: blur(40px);
          animation: pulse 3s ease-in-out infinite;
          pointer-events: none;
        }

        .game-visual-link {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .game-character-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 20px 40px rgba(139, 92, 246, 0.6));
          transition: transform 0.3s ease;
        }

        .game-visual-link:hover .game-character-img {
          transform: scale(1.05);
        }

        .game-visual-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transform: translateX(-100%);
          transition: transform 0.8s ease;
          pointer-events: none;
        }

        .game-visual-link:hover .game-visual-shine {
          transform: translateX(100%);
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        /* Shows Section */
        .shows {
          padding: 8rem 4rem;
          background: var(--bg-surface);
        }

        .shows-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .show-card {
          background: var(--bg-elevated);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.4s ease;
          position: relative;
        }

        .show-card:hover {
          transform: translateY(-10px);
          border-color: rgba(6, 182, 212, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        .show-card-image {
          aspect-ratio: 16/10;
          background: var(--bg-deep);
          position: relative;
          overflow: hidden;
        }

        .show-card-gradient {
          position: absolute;
          inset: 0;
        }

        .show-card:nth-child(1) .show-card-gradient {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3));
        }

        .show-card:nth-child(2) .show-card-gradient {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(239, 68, 68, 0.3));
        }

        .show-card:nth-child(3) .show-card-gradient {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(6, 182, 212, 0.3));
        }

        .show-card-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          padding: 0.4rem 1rem;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .show-card-content {
          padding: 1.5rem;
        }

        .show-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .show-card-description {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-bottom: 1rem;
        }

        .show-card-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        /* Cast Section */
        .cast {
          padding: 8rem 4rem;
          position: relative;
        }

        .cast-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .cast-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          background: var(--bg-elevated);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.4s ease;
          cursor: pointer;
        }

        .cast-card:hover {
          transform: translateY(-8px);
          border-color: var(--accent-primary);
          box-shadow: 0 20px 60px rgba(6, 182, 212, 0.2);
        }

        .cast-card-image {
          aspect-ratio: 1;
          background: var(--bg-deep);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .cast-card-placeholder {
          font-size: 4rem;
          opacity: 0.3;
        }

        .cast-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, var(--bg-elevated), transparent 50%);
        }

        .cast-card-content {
          padding: 1.25rem;
          text-align: center;
        }

        .cast-card-name {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .cast-card-role {
          color: var(--accent-primary);
          font-size: 0.85rem;
          font-weight: 500;
        }

        /* Schedule Section */
        .schedule {
          padding: 8rem 4rem;
          background: var(--bg-surface);
        }

        .schedule-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .schedule-item {
          display: grid;
          grid-template-columns: 150px 1fr auto;
          gap: 2rem;
          align-items: center;
          padding: 2rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .schedule-item:hover {
          background: rgba(6, 182, 212, 0.05);
          margin: 0 -2rem;
          padding: 2rem;
          border-radius: 15px;
          border-color: transparent;
        }

        .schedule-time {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.5rem;
          color: var(--accent-primary);
          letter-spacing: 0.05em;
        }

        .schedule-info h4 {
          font-family: 'Syne', sans-serif;
          font-size: 1.3rem;
          margin-bottom: 0.25rem;
        }

        .schedule-info p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .schedule-status {
          padding: 0.5rem 1.25rem;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .schedule-status.upcoming {
          background: rgba(6, 182, 212, 0.2);
          color: var(--accent-primary);
        }

        /* Latest Episodes Section */
        .latest-episodes,
        .latest-shorts {
          padding: 6rem 2rem;
          background: var(--bg-deep);
          min-height: 400px;
        }

        .latest-episodes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 3rem auto 0;
        }

        .episode-card {
          background: var(--bg-elevated);
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .episode-card:hover {
          transform: translateY(-8px);
          border-color: var(--accent-primary);
          box-shadow: 0 20px 40px rgba(6, 182, 212, 0.2);
        }

        .episode-thumbnail {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 */
          background: var(--bg-surface);
          overflow: hidden;
        }

        .episode-thumbnail img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .episode-card:hover .episode-thumbnail img {
          transform: scale(1.05);
        }

        .episode-play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .episode-card:hover .episode-play-overlay {
          opacity: 1;
        }

        .episode-play-overlay svg {
          width: 60px;
          height: 60px;
          color: white;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
        }

        .episode-duration {
          position: absolute;
          bottom: 8px;
          right: 8px;
          padding: 0.25rem 0.5rem;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 4px;
        }

        .episode-content {
          padding: 1.25rem;
        }

        .episode-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.4;
          margin-bottom: 0.75rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .episode-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        /* Latest Shorts Section */
        .latest-shorts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1.5rem;
          max-width: 1200px;
          margin: 3rem auto 0;
        }

        .short-card {
          background: var(--bg-elevated);
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .short-card:hover {
          transform: translateY(-6px);
          border-color: var(--accent-secondary);
          box-shadow: 0 15px 30px rgba(139, 92, 246, 0.2);
        }

        .short-thumbnail {
          position: relative;
          width: 100%;
          padding-top: 177.77%; /* 9:16 for shorts */
          background: var(--bg-surface);
          overflow: hidden;
        }

        .short-thumbnail img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .short-card:hover .short-thumbnail img {
          transform: scale(1.05);
        }

        .short-play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .short-card:hover .short-play-overlay {
          opacity: 1;
        }

        .short-play-overlay svg {
          width: 40px;
          height: 40px;
          color: white;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
        }

        .short-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 0.25rem 0.5rem;
          background: rgba(139, 92, 246, 0.9);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }

        .short-content {
          padding: 1rem;
        }

        .short-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
          margin-bottom: 0.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .short-views {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .latest-episodes-loading,
        .latest-episodes-error {
          max-width: 1200px;
          margin: 3rem auto;
          text-align: center;
          padding: 4rem 2rem;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(6, 182, 212, 0.2);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .latest-episodes-loading p,
        .latest-episodes-error p {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .update-featured {
          background: var(--bg-elevated);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .update-featured:hover {
          border-color: rgba(6, 182, 212, 0.3);
        }

        .update-featured-image {
          aspect-ratio: 21/9;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2));
          position: relative;
        }

        .update-featured-badge {
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          padding: 0.5rem 1rem;
          background: var(--accent-warm);
          color: var(--bg-deep);
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .update-featured-content {
          padding: 2rem;
        }

        .update-featured-date {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-bottom: 0.75rem;
        }

        .update-featured-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.75rem;
          margin-bottom: 1rem;
        }

        .update-featured-excerpt {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .updates-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .update-small {
          background: var(--bg-elevated);
          border-radius: 15px;
          padding: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .update-small:hover {
          border-color: rgba(6, 182, 212, 0.3);
          transform: translateX(5px);
        }

        .update-small-date {
          color: var(--text-muted);
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
        }

        .update-small-title {
          font-weight: 600;
          font-size: 1rem;
          line-height: 1.4;
        }

        /* Newsletter Section */
        .newsletter {
          padding: 6rem 4rem;
          background: var(--bg-surface);
        }

        .newsletter-container {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
          padding: 4rem;
          background: var(--bg-elevated);
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
        }

        .newsletter-glow {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.1;
        }

        .newsletter-glow-1 {
          top: -200px;
          left: -200px;
          background: var(--accent-primary);
        }

        .newsletter-glow-2 {
          bottom: -200px;
          right: -200px;
          background: var(--accent-secondary);
        }

        .newsletter-content {
          position: relative;
          z-index: 10;
        }

        .newsletter h2 {
          font-family: 'Syne', sans-serif;
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .newsletter p {
          color: var(--text-secondary);
          margin-bottom: 2rem;
          font-size: 1.1rem;
        }

        .newsletter-form {
          display: flex;
          gap: 1rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .newsletter-input {
          flex: 1;
          padding: 1rem 1.5rem;
          background: var(--bg-deep);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50px;
          color: var(--text-primary);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.3s ease;
        }

        .newsletter-input:focus {
          border-color: var(--accent-primary);
        }

        .newsletter-input::placeholder {
          color: var(--text-muted);
        }

        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }

        /* Social Media Section */
        .social-section {
          padding: 6rem 2rem;
          background: linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-surface) 100%);
        }

        .social-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .social-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .social-card {
          position: relative;
          padding: 2.5rem 2rem;
          background: var(--bg-elevated);
          border: 2px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          text-align: center;
          text-decoration: none;
          color: var(--text-primary);
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .social-card:hover {
          transform: translateY(-10px);
          border-color: transparent;
        }

        .social-card-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .social-card:hover .social-card-glow {
          opacity: 0.1;
        }

        .social-card-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 1.5rem;
          position: relative;
          z-index: 1;
          transition: all 0.4s ease;
        }

        .social-card:hover .social-card-icon {
          transform: scale(1.2) rotate(5deg);
        }

        .social-card h3 {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          position: relative;
          z-index: 1;
        }

        .social-card p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          position: relative;
          z-index: 1;
        }

        /* Brand-specific card colors */
        .social-card-youtube:hover {
          box-shadow: 0 20px 60px rgba(255, 0, 0, 0.3);
        }

        .social-card-youtube:hover .social-card-glow {
          background: linear-gradient(135deg, #FF0000, #CC0000);
          opacity: 0.15;
        }

        .social-card-youtube:hover .social-card-icon {
          color: #FF0000;
        }

        .social-card-tiktok:hover {
          box-shadow: 0 20px 60px rgba(0, 242, 234, 0.3);
        }

        .social-card-tiktok:hover .social-card-glow {
          background: linear-gradient(135deg, #00f2ea, #ff0050);
          opacity: 0.15;
        }

        .social-card-tiktok:hover .social-card-icon {
          color: #00f2ea;
        }

        .social-card-twitter:hover {
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .social-card-twitter:hover .social-card-glow {
          background: linear-gradient(135deg, #000000, #333333);
          opacity: 0.2;
        }

        .social-card-twitter:hover .social-card-icon {
          color: #ffffff;
        }

        .social-card-twitch:hover {
          box-shadow: 0 20px 60px rgba(145, 70, 255, 0.3);
        }

        .social-card-twitch:hover .social-card-glow {
          background: linear-gradient(135deg, #9146FF, #6441a5);
          opacity: 0.15;
        }

        .social-card-twitch:hover .social-card-icon {
          color: #9146FF;
        }

        .social-card-discord:hover {
          box-shadow: 0 20px 60px rgba(88, 101, 242, 0.3);
        }

        .social-card-discord:hover .social-card-glow {
          background: linear-gradient(135deg, #5865F2, #7289DA);
          opacity: 0.15;
        }

        .social-card-discord:hover .social-card-icon {
          color: #5865F2;
        }

        .footer {
          padding: 4rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-logo {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          background: var(--gradient-accent);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-links {
          display: flex;
          gap: 2rem;
        }

        .footer-links a {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }

        .footer-links a:hover {
          color: var(--accent-primary);
        }

        .footer-social {
          display: flex;
          gap: 1rem;
        }

        .footer-social a {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }

        .footer-social a svg {
          width: 20px;
          height: 20px;
          position: relative;
          z-index: 1;
          transition: transform 0.4s ease;
        }

        .footer-social a::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .footer-social a:hover {
          transform: translateY(-5px) scale(1.1);
          border-color: transparent;
          box-shadow: 0 10px 30px rgba(6, 182, 212, 0.4);
        }

        .footer-social a:hover::before {
          opacity: 1;
        }

        .footer-social a:hover svg {
          transform: scale(1.1);
          color: white;
        }

        /* Brand-specific hover colors */
        .social-youtube:hover {
          box-shadow: 0 10px 30px rgba(255, 0, 0, 0.4);
        }

        .social-youtube:hover::before {
          background: linear-gradient(135deg, #FF0000, #CC0000);
        }

        .social-tiktok:hover {
          box-shadow: 0 10px 30px rgba(0, 242, 234, 0.4);
        }

        .social-tiktok:hover::before {
          background: linear-gradient(135deg, #00f2ea, #ff0050);
        }

        .social-twitter:hover {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .social-twitter:hover::before {
          background: linear-gradient(135deg, #000000, #333333);
        }

        .social-twitch:hover {
          box-shadow: 0 10px 30px rgba(145, 70, 255, 0.4);
        }

        .social-twitch:hover::before {
          background: linear-gradient(135deg, #9146FF, #6441a5);
        }

        .social-discord:hover {
          box-shadow: 0 10px 30px rgba(88, 101, 242, 0.4);
        }

        .social-discord:hover::before {
          background: linear-gradient(135deg, #5865F2, #7289DA);
        }

        @media (max-width: 1024px) {
          .nav { padding: 1rem 2rem; }
          .nav-links { display: none; }
          .hero { padding: 6rem 2rem 4rem; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .game-showcase { padding: 4rem 2rem; }
          .game-showcase-container { grid-template-columns: 1fr; gap: 4rem; }
          .game-title-top { font-size: 2rem; }
          .game-title-main { font-size: 3.5rem; }
          .about-grid { grid-template-columns: 1fr; }
          .shows-grid { grid-template-columns: 1fr 1fr; }
          .cast-grid { grid-template-columns: repeat(2, 1fr); }
          .updates-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .game-showcase { padding: 3rem 1.5rem; }
          .game-title-top { font-size: 1.5rem; letter-spacing: 0.3rem; }
          .game-title-main { font-size: 2.5rem; letter-spacing: 0.2rem; }
          .game-features-grid { grid-template-columns: 1fr; }
          .game-cta-button { padding: 1rem 2rem; font-size: 1rem; width: 100%; justify-content: center; }
          .shows-grid { grid-template-columns: 1fr; }
          .schedule-item { grid-template-columns: 1fr; gap: 0.75rem; }
          .newsletter-form { flex-direction: column; }
          .footer-content { flex-direction: column; gap: 2rem; text-align: center; }
          .footer-links { flex-wrap: wrap; justify-content: center; }
          .footer-social { justify-content: center; }
        }

        /* Ultra Chat Floating Action Button */
        .ultra-chat-fab {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 9998;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
          border: none;
          border-radius: 50px;
          color: white;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 10px 40px rgba(6, 182, 212, 0.3), 0 0 20px rgba(139, 92, 246, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: ultra-chat-pulse 2s ease-in-out infinite;
        }

        .ultra-chat-fab:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 15px 50px rgba(6, 182, 212, 0.4), 0 0 30px rgba(139, 92, 246, 0.3);
        }

        .ultra-chat-fab:active {
          transform: translateY(-1px) scale(1.02);
        }

        .ultra-chat-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .ultra-chat-label {
          white-space: nowrap;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: 0.02em;
        }

        @keyframes ultra-chat-pulse {
          0%, 100% {
            box-shadow: 0 10px 40px rgba(6, 182, 212, 0.3), 0 0 20px rgba(139, 92, 246, 0.2);
          }
          50% {
            box-shadow: 0 10px 40px rgba(6, 182, 212, 0.5), 0 0 30px rgba(139, 92, 246, 0.4);
          }
        }

        @media (max-width: 768px) {
          .ultra-chat-fab {
            bottom: 1.5rem;
            right: 1.5rem;
            padding: 0.875rem 1.25rem;
            font-size: 0.9rem;
          }

          .ultra-chat-label {
            display: none;
          }

          .ultra-chat-fab {
            width: 56px;
            height: 56px;
            padding: 0;
            justify-content: center;
            border-radius: 50%;
          }

          .ultra-chat-icon {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div className="noise-overlay" />

      <nav className="nav" id="nav">
        <div className="logo">THE LIVE STREAM SHOW</div>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#shows">Shows</a></li>
          <li><a href="#cast">Cast</a></li>
          <li><a href="#schedule">Schedule</a></li>
        </ul>
        <Link to="/admin" className="nav-cta">Admin Portal</Link>
      </nav>

      <section className="hero">
        <div className="hero-bg-grid" />
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Season 4 Now Streaming
          </div>
          <h1 className="hero-title">
            <span className="hero-title-line">THE LIVE</span>
            <span className="hero-title-line hero-title-gradient">STREAM SHOW</span>
          </h1>
          <p className="hero-tagline">Purposeful Illusion</p>
          <p className="hero-description">
            Where entertainment meets innovation. Join our community for live debates,
            morning shows, gaming streams, and unfiltered conversations that challenge the norm.
          </p>
          <div className="hero-actions">
            <a href="https://www.youtube.com/@AbeLiveStream" target="_blank" rel="noopener noreferrer" className="btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Watch Now
            </a>
            <button onClick={() => setIsUltraChatOpen(true)} className="btn-secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Send Ultra Chat
            </button>
          </div>
        </div>

        <div className="hero-scroll-indicator">
          SCROLL
          <div className="scroll-line" />
        </div>
      </section>

      <section className="stats-bar">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">4</div>
            <div className="stat-label">Seasons Strong</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Episodes</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Community Members</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">∞</div>
            <div className="stat-label">Hot Takes</div>
          </div>
        </div>
      </section>

      {/* Big Time Lucky 13 Game Section */}
      <section className="game-showcase" id="game">
        <div className="game-showcase-bg"></div>
        <div className="game-showcase-container">
          <div className="game-showcase-content reveal">
            <div className="game-badge">
              <svg viewBox="0 0 24 24" fill="currentColor" className="game-badge-icon">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
              Featured Game
            </div>
            <h2 className="game-title">
              <span className="game-title-top">BIG TIME</span>
              <span className="game-title-main">LUCKY <span className="game-title-13">13</span></span>
            </h2>
            <p className="game-tagline">Where Destiny Meets Fortune</p>
            <p className="game-description">
              Experience the thrill of high-end slot gaming reimagined for streaming entertainment.
              Stunning visuals, immersive soundscapes, and the excitement of Vegas—all without the gambling.
              Pure fun, pure entertainment.
            </p>
            <div className="game-features-grid">
              <div className="game-feature-item">
                <div className="game-feature-icon">🎰</div>
                <div className="game-feature-text">
                  <div className="game-feature-title">Premium Slots</div>
                  <div className="game-feature-desc">Vegas-quality experience</div>
                </div>
              </div>
              <div className="game-feature-item">
                <div className="game-feature-icon">🌙</div>
                <div className="game-feature-text">
                  <div className="game-feature-title">Lunar Theme</div>
                  <div className="game-feature-desc">Mystical moon phases</div>
                </div>
              </div>
              <div className="game-feature-item">
                <div className="game-feature-icon">🎭</div>
                <div className="game-feature-text">
                  <div className="game-feature-title">No Gambling</div>
                  <div className="game-feature-desc">Pure entertainment only</div>
                </div>
              </div>
              <div className="game-feature-item">
                <div className="game-feature-icon">✨</div>
                <div className="game-feature-text">
                  <div className="game-feature-title">Free to Play</div>
                  <div className="game-feature-desc">Stream-ready slots</div>
                </div>
              </div>
            </div>
            <a href="https://lucky-13-game.thelivestreamshow.com" target="_blank" rel="noopener noreferrer" className="game-cta-button">
              <span className="game-cta-text">Play Big Time Lucky 13</span>
              <svg className="game-cta-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <p className="game-disclaimer">Streaming slots without the gambling • For fun and entertainment</p>
          </div>
          <div className="game-showcase-visual reveal">
            <div className="game-visual-frame">
              <div className="game-visual-glow"></div>
              <a href="https://lucky-13-game.thelivestreamshow.com" target="_blank" rel="noopener noreferrer" className="game-visual-link">
                <img
                  src="https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/12ae2f85-70ac-4009-8400-6c680a6c1300/public"
                  alt="Big Time Lucky 13 Lunar Goddess"
                  className="game-character-img"
                />
                <div className="game-visual-shine"></div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about" id="about">
        <div className="section-header reveal">
          <p className="section-label">About The Show</p>
          <h2 className="section-title">More Than Just a Stream</h2>
          <p className="section-subtitle">
            A production studio and content platform pushing the boundaries of live entertainment
          </p>
        </div>

        <div className="about-grid">
          <div className="about-content reveal">
            <h3>Built Different</h3>
            <p>
              The Live Stream Show isn't just content—it's a movement. We've created a space
              where authentic conversations thrive, where debates get heated (but stay
              respectful), and where community isn't just a buzzword.
            </p>
            <p>
              From our flagship debate series "Address All The Smoke" to our collaborative
              Morning Show with Blue Olive Media, we're redefining what streaming can be.
            </p>
            <div className="about-features">
              <div className="about-feature">
                <span className="about-feature-icon">
                  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                Professional Production
              </div>
              <div className="about-feature">
                <span className="about-feature-icon">
                  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                Live Debates
              </div>
              <div className="about-feature">
                <span className="about-feature-icon">
                  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                Gaming Content
              </div>
              <div className="about-feature">
                <span className="about-feature-icon">
                  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                Community Driven
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shows Section */}
      <section className="shows" id="shows">
        <div className="section-header reveal">
          <p className="section-label">Our Shows</p>
          <h2 className="section-title">What We're Creating</h2>
          <p className="section-subtitle">
            Multiple formats, one mission: authentic entertainment
          </p>
        </div>

        <div className="shows-grid">
          <div className="show-card reveal">
            <div className="show-card-image">
              <div className="show-card-gradient" />
              <span className="show-card-badge">Flagship</span>
            </div>
            <div className="show-card-content">
              <h3 className="show-card-title">Address All The Smoke</h3>
              <p className="show-card-description">
                Our signature debate series where panelists tackle the hottest takes
                and most controversial topics. No filter, all substance.
              </p>
              <div className="show-card-meta">
                <span>📺 Weekly</span>
                <span>🔥 Season 4</span>
              </div>
            </div>
          </div>

          <div className="show-card reveal">
            <div className="show-card-image">
              <div className="show-card-gradient" />
              <span className="show-card-badge">Daily</span>
            </div>
            <div className="show-card-content">
              <h3 className="show-card-title">The Morning Stream</h3>
              <p className="show-card-description">
                Start your day right. News, vibes, and conversations with Blue Olive Media.
                Your new morning routine.
              </p>
              <div className="show-card-meta">
                <span>☀️ Weekdays</span>
                <span>☕ 9AM EST</span>
              </div>
            </div>
          </div>

          <div className="show-card reveal">
            <div className="show-card-image">
              <div className="show-card-gradient" />
              <span className="show-card-badge">Gaming</span>
            </div>
            <div className="show-card-content">
              <h3 className="show-card-title">Warzone Sessions</h3>
              <p className="show-card-description">
                Call of Duty Warzone gameplay with commentary, squad runs,
                and community game nights. Get in the lobby.
              </p>
              <div className="show-card-meta">
                <span>🎮 Live</span>
                <span>🏆 Ranked</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cast Section */}
      <section className="cast" id="cast">
        <div className="section-header reveal">
          <p className="section-label">Season 4 Cast</p>
          <h2 className="section-title">Meet The Crew</h2>
          <p className="section-subtitle">
            The voices and personalities that make it all happen
          </p>
        </div>

        <div className="cast-grid">
          <div className="cast-card reveal">
            <div className="cast-card-image">
              <div className="cast-card-placeholder">🎙️</div>
              <div className="cast-card-overlay" />
            </div>
            <div className="cast-card-content">
              <h4 className="cast-card-name">Abe</h4>
              <p className="cast-card-role">Host & Creator</p>
            </div>
          </div>

          <div className="cast-card reveal">
            <div className="cast-card-image">
              <div className="cast-card-placeholder">🐍</div>
              <div className="cast-card-overlay" />
            </div>
            <div className="cast-card-content">
              <h4 className="cast-card-name">Rattlesnake</h4>
              <p className="cast-card-role">Panelist</p>
            </div>
          </div>

          <div className="cast-card reveal">
            <div className="cast-card-image">
              <div className="cast-card-placeholder">🏈</div>
              <div className="cast-card-overlay" />
            </div>
            <div className="cast-card-content">
              <h4 className="cast-card-name">Jags</h4>
              <p className="cast-card-role">Panelist</p>
            </div>
          </div>

          <div className="cast-card reveal">
            <div className="cast-card-image">
              <div className="cast-card-placeholder">💫</div>
              <div className="cast-card-overlay" />
            </div>
            <div className="cast-card-content">
              <h4 className="cast-card-name">Babs</h4>
              <p className="cast-card-role">Panelist</p>
            </div>
          </div>

          <div className="cast-card reveal">
            <div className="cast-card-image">
              <div className="cast-card-placeholder">🦅</div>
              <div className="cast-card-overlay" />
            </div>
            <div className="cast-card-content">
              <h4 className="cast-card-name">El Garza</h4>
              <p className="cast-card-role">Panelist</p>
            </div>
          </div>

          <div className="cast-card reveal">
            <div className="cast-card-image">
              <div className="cast-card-placeholder">✈️</div>
              <div className="cast-card-overlay" />
            </div>
            <div className="cast-card-content">
              <h4 className="cast-card-name">Howard Hughes</h4>
              <p className="cast-card-role">Panelist</p>
            </div>
          </div>

          <div className="cast-card reveal">
            <div className="cast-card-image">
              <div className="cast-card-placeholder">👁️</div>
              <div className="cast-card-overlay" />
            </div>
            <div className="cast-card-content">
              <h4 className="cast-card-name">Dr. MindEye</h4>
              <p className="cast-card-role">Panelist</p>
            </div>
          </div>

          <div className="cast-card reveal">
            <div className="cast-card-image">
              <div className="cast-card-placeholder">🤖</div>
              <div className="cast-card-overlay" />
            </div>
            <div className="cast-card-content">
              <h4 className="cast-card-name">Beta Bot</h4>
              <p className="cast-card-role">AI Co-Host</p>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="schedule" id="schedule">
        <div className="section-header reveal">
          <p className="section-label">This Week</p>
          <h2 className="section-title">Stream Schedule</h2>
          <p className="section-subtitle">
            Don't miss a moment. Set your reminders.
          </p>
        </div>

        <div className="schedule-container">
          <div className="schedule-item reveal">
            <div className="schedule-time">MON 9PM EST</div>
            <div className="schedule-info">
              <h4>Address All The Smoke</h4>
              <p>Weekly debate series with the full panel</p>
            </div>
            <span className="schedule-status upcoming">Upcoming</span>
          </div>

          <div className="schedule-item reveal">
            <div className="schedule-time">TUE-FRI 9AM</div>
            <div className="schedule-info">
              <h4>The Morning Stream</h4>
              <p>Daily morning show with Blue Olive Media</p>
            </div>
            <span className="schedule-status upcoming">Upcoming</span>
          </div>

          <div className="schedule-item reveal">
            <div className="schedule-time">WED 8PM EST</div>
            <div className="schedule-info">
              <h4>Warzone Wednesday</h4>
              <p>Community game night - join the squad</p>
            </div>
            <span className="schedule-status upcoming">Upcoming</span>
          </div>

          <div className="schedule-item reveal">
            <div className="schedule-time">SAT 7PM EST</div>
            <div className="schedule-info">
              <h4>Saturday Night Special</h4>
              <p>Extended content and special guests</p>
            </div>
            <span className="schedule-status upcoming">Upcoming</span>
          </div>
        </div>
      </section>

      {/* Latest Episodes Section */}
      <section className="latest-episodes" id="episodes">
        <div className="section-header reveal">
          <p className="section-label">Fresh Content</p>
          <h2 className="section-title">Latest Episodes</h2>
          <p className="section-subtitle">Catch up on the newest drops from the show</p>
        </div>
        <LatestEpisodes />
      </section>

      {/* Latest Shorts Section */}
      <section className="latest-shorts">
        <div className="section-header reveal">
          <p className="section-label">Quick Clips</p>
          <h2 className="section-title">Latest Shorts</h2>
          <p className="section-subtitle">Bite-sized moments from the stream</p>
        </div>
        <LatestShorts />
      </section>

      {/* Social Media Section */}
      <section className="social-section">
        <div className="social-container reveal">
          <div className="section-header">
            <p className="section-label">Connect With Us</p>
            <h2 className="section-title">Follow The Stream</h2>
            <p className="section-subtitle">Join our community across all platforms</p>
          </div>

          <div className="social-cards">
            <a href="https://www.youtube.com/@AbeLiveStream" target="_blank" rel="noopener noreferrer" className="social-card social-card-youtube">
              <div className="social-card-glow" />
              <svg className="social-card-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <h3>YouTube</h3>
              <p>Watch full episodes & highlights</p>
            </a>

            <a href="https://www.tiktok.com/@abestream" target="_blank" rel="noopener noreferrer" className="social-card social-card-tiktok">
              <div className="social-card-glow" />
              <svg className="social-card-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <h3>TikTok</h3>
              <p>Quick clips & behind the scenes</p>
            </a>

            <a href="https://twitter.com/abe_nasty" target="_blank" rel="noopener noreferrer" className="social-card social-card-twitter">
              <div className="social-card-glow" />
              <svg className="social-card-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <h3>X (Twitter)</h3>
              <p>Real-time updates & discussions</p>
            </a>

            <a href="https://www.twitch.tv/abelivestream" target="_blank" rel="noopener noreferrer" className="social-card social-card-twitch">
              <div className="social-card-glow" />
              <svg className="social-card-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
              </svg>
              <h3>Twitch</h3>
              <p>Live streams & gaming content</p>
            </a>

            <a href="https://discord.gg/GAsTmtPdsx" target="_blank" rel="noopener noreferrer" className="social-card social-card-discord">
              <div className="social-card-glow" />
              <svg className="social-card-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <h3>Discord</h3>
              <p>Join the community & chat live</p>
            </a>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter">
        <div className="newsletter-container reveal">
          <div className="newsletter-glow newsletter-glow-1" />
          <div className="newsletter-glow newsletter-glow-2" />
          <div className="newsletter-content">
            <h2>Stay Connected</h2>
            <p>Get notified when we go live, plus exclusive updates and behind-the-scenes content.</p>
            <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Newsletter signup coming soon!'); }}>
              <input type="email" className="newsletter-input" placeholder="Enter your email" required />
              <button type="submit" className="btn-primary">Subscribe</button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">THE LIVE STREAM SHOW</div>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
            <Link to="/admin">Admin</Link>
          </div>
          <div className="footer-social">
            <a href="https://www.youtube.com/@AbeLiveStream" target="_blank" rel="noopener noreferrer" title="YouTube" className="social-youtube">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a href="https://www.tiktok.com/@abestream" target="_blank" rel="noopener noreferrer" title="TikTok" className="social-tiktok">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
            <a href="https://twitter.com/abe_nasty" target="_blank" rel="noopener noreferrer" title="X (Twitter)" className="social-twitter">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://www.twitch.tv/abelivestream" target="_blank" rel="noopener noreferrer" title="Twitch" className="social-twitch">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
              </svg>
            </a>
            <a href="https://discord.gg/GAsTmtPdsx" target="_blank" rel="noopener noreferrer" title="Discord" className="social-discord">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>

      {/* Floating Ultra Chat Button */}
      <button
        onClick={() => setIsUltraChatOpen(true)}
        className="ultra-chat-fab"
        aria-label="Send Ultra Chat"
      >
        <svg className="ultra-chat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor" />
        </svg>
        <span className="ultra-chat-label">Ultra Chat</span>
      </button>

      {/* Ultra Chat Modal */}
      <UltraChatModal
        isOpen={isUltraChatOpen}
        onClose={() => setIsUltraChatOpen(false)}
      />
    </>
  )
}
