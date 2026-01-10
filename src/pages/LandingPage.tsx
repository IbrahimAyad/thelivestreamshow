import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UltraChatModal } from '../components/UltraChatModal'

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

        .about-play-btn {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--gradient-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 40px rgba(6, 182, 212, 0.4);
        }

        .about-play-btn:hover {
          transform: scale(1.1);
        }

        .about-play-btn svg {
          width: 30px;
          height: 30px;
          fill: var(--bg-deep);
          margin-left: 5px;
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

        /* Updates Section */
        .updates {
          padding: 8rem 4rem;
        }

        .updates-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
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
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 1.25rem;
        }

        .footer-social a:hover {
          background: var(--accent-primary);
          color: var(--bg-deep);
          transform: translateY(-3px);
        }

        @media (max-width: 1024px) {
          .nav { padding: 1rem 2rem; }
          .nav-links { display: none; }
          .hero { padding: 6rem 2rem 4rem; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .about-grid { grid-template-columns: 1fr; }
          .shows-grid { grid-template-columns: 1fr 1fr; }
          .cast-grid { grid-template-columns: repeat(2, 1fr); }
          .updates-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
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
            <a href="https://youtube.com/@thelivestreamshow" target="_blank" rel="noopener noreferrer" className="btn-primary">
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
          <div className="about-visual reveal">
            <div className="about-visual-inner">
              <a href="https://youtube.com/@thelivestreamshow" target="_blank" rel="noopener noreferrer" className="about-play-btn">
                <svg viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </a>
            </div>
          </div>
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

      {/* Updates Section */}
      <section className="updates" id="updates">
        <div className="section-header reveal">
          <p className="section-label">Latest News</p>
          <h2 className="section-title">Updates & Announcements</h2>
        </div>

        <div className="updates-grid">
          <div className="update-featured reveal">
            <div className="update-featured-image">
              <span className="update-featured-badge">New</span>
            </div>
            <div className="update-featured-content">
              <p className="update-featured-date">January 2026</p>
              <h3 className="update-featured-title">Season 4 Officially Launches</h3>
              <p className="update-featured-excerpt">
                The wait is over. Season 4 of The Live Stream Show brings new panelists,
                upgraded production, and more fire content than ever before. Get ready
                for our biggest season yet.
              </p>
              <a href="#shows" className="btn-secondary">Learn More</a>
            </div>
          </div>

          <div className="updates-sidebar">
            <div className="update-small reveal">
              <p className="update-small-date">Coming Soon</p>
              <h4 className="update-small-title">New YouTube Channel Network Expansion</h4>
            </div>
            <div className="update-small reveal">
              <p className="update-small-date">In Development</p>
              <h4 className="update-small-title">Custom Overlay System for Creators</h4>
            </div>
            <div className="update-small reveal">
              <p className="update-small-date">Community</p>
              <h4 className="update-small-title">Discord Subscriber Benefits Updated</h4>
            </div>
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
            <a href="https://youtube.com/@thelivestreamshow" target="_blank" rel="noopener noreferrer" title="YouTube">📺</a>
            <a href="#" title="Discord">💬</a>
            <a href="#" title="Twitter">🐦</a>
            <a href="#" title="Instagram">📷</a>
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
