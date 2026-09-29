import { useEffect, useState } from 'react';
import { ArrowRight, Boxes, Camera, CheckCheck, ChevronLeft, ChevronRight, CircleCheck, FileCheck2, Pause, Play, ScanLine, ScanSearch, ShieldCheck, SlidersHorizontal, BadgeCheck, Cpu, FileText, Settings2 } from 'lucide-react';
import { usePortal } from '../lib/context';
import { ASSETS, BRAND_NAME, BRAND_TAGLINE, summarize } from '../lib/data';
import { StatGrid } from '../components/Common';

const slides = [
  { image: ASSETS.pm, alt: 'Prime Minister Narendra Modi at the Plant Phenomics Centre, IARI, New Delhi, 11 October 2017. Photograph by the Prime Minister\'s Office, GODL-India.', title: 'Technology for Transparent Agricultural Procurement', description: '', cta: 'Learn More', path: '/about' },
  { image: ASSETS.market, alt: 'An Indian produce market with onion sacks prepared for sale', title: 'Transparent Quality Assessment', description: 'Standardizing quality evaluation across procurement centers.', cta: 'View Dashboard', path: '/dashboard' },
  { image: ASSETS.farm, alt: 'A farmer harvesting onions in a green agricultural field in Nagpur, India', title: 'Pyaaz Drishti', description: 'Smart, transparent and consistent onion grading using Artificial Intelligence.', cta: 'Start Assessment', path: '/assessment' },
];

function HeroSlider() {
  const { t, reduceMotion } = usePortal();
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !reduceMotion);
  useEffect(() => { if (reduceMotion) setPlaying(false); }, [reduceMotion]);
  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => { if (!document.hidden) setCurrent((value) => (value + 1) % slides.length); }, 6000);
    return () => window.clearInterval(interval);
  }, [playing, current]);
  const move = (direction: number) => setCurrent((value) => (value + direction + slides.length) % slides.length);
  return <section className="hero-slider" aria-roledescription="carousel" aria-label="Onion quality assessment highlights" onFocusCapture={(event) => { if (!(event.target as HTMLElement).closest('.play-button')) setPlaying(false); }}>
    <div className="hero-stage" aria-live={playing ? 'off' : 'polite'}>
      {slides.map((slide, index) => <article key={slide.title} className={`hero-slide hero-slide-${index + 1} ${index === current ? 'is-active' : ''}`} aria-hidden={index !== current} aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}`}>
        <img className="hero-photo" src={slide.image} alt={slide.alt} fetchPriority={index === 0 ? 'high' : 'auto'} loading={index === 0 ? 'eager' : 'lazy'} />
        <div className="hero-overlay" />
        <div className="container hero-content"><div className="hero-copy"><span className="hero-accent" aria-hidden="true" /><h1>{t(slide.title)}</h1>{slide.description ? <p>{t(slide.description)}</p> : null}<a className="button button-saffron" href={`#${slide.path}`} tabIndex={index === current ? 0 : -1}>{t(slide.cta)}<ArrowRight size={18} /></a></div></div>
      </article>)}
    </div>
    <div className="slider-control-bar"><div className="container slider-controls"><div className="slide-counter"><strong>0{current + 1}</strong><span>/ 03</span></div><div className="slide-indicators" aria-label="Choose slide">{slides.map((slide, index) => <button key={slide.title} className={index === current ? 'active' : ''} onClick={() => setCurrent(index)} aria-label={`Show slide ${index + 1}: ${slide.title}`} aria-pressed={index === current} />)}</div><div className="slider-buttons"><button onClick={() => move(-1)} aria-label="Previous slide"><ChevronLeft size={16} /><span>{t('Previous')}</span></button><button className="play-button" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause slideshow' : 'Play slideshow'} title={playing ? 'Pause slideshow' : 'Play slideshow'}>{playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}<span className="sr-only">{t(playing ? 'Pause' : 'Play')}</span></button><button onClick={() => move(1)} aria-label="Next slide"><span>{t('Next')}</span><ChevronRight size={16} /></button></div></div></div>
  </section>;
}

const steps = [
  { title: 'Capture Image', description: 'Upload or take a photograph', icon: Camera },
  { title: 'AI Detection', description: 'Locate onions in the sample', icon: ScanLine },
  { title: 'Defect Identification', description: 'Identify visible quality issues', icon: ScanSearch },
  { title: 'Quality Grading', description: 'Classify the sample quality', icon: ShieldCheck },
  { title: 'Digital Report', description: 'View and download results', icon: FileCheck2 },
];

const capabilities = [
  { title: 'Rule-Based Grading', description: 'Configurable government policies convert AI observations into consistent grades — no model retraining needed.', icon: Settings2, path: '/grading', link: 'Configure policy' },
  { title: 'Verifiable Reports', description: 'Every report carries a verification ID and traceable audit trail for officers and auditors.', icon: BadgeCheck, path: '/verify', link: 'Verify a report' },
  { title: 'Edge AI & Offline', description: 'On-device inspection with offline-first storage, sync status and regional adaptation.', icon: Cpu, path: '/edge', link: 'Open Edge AI' },
  { title: 'Instant Digital Reports', description: 'Batch ID, officer, location, size and defect analysis with download and print.', icon: FileText, path: '/reports', link: 'View reports' },
];

export default function Home() {
  const { records, t, policy } = usePortal();
  const { total, quality } = summarize(records);
  return <div className="home-page page-enter">
    <HeroSlider />
    <section className="container home-intro" aria-labelledby="intro-title"><div><div className="section-eyebrow">{t('ABOUT THE SYSTEM')}</div><h2 id="intro-title">{t(BRAND_NAME)}</h2><p className="brand-tagline">{t(BRAND_TAGLINE)}</p></div><div className="intro-description"><p>{t('The system uses computer vision to identify visible quality parameters such as damage, rotting, sprouting and size, and generates a digital quality assessment.')}</p><a className="text-link" href="#/standards">{t('Explore quality standards')}<ArrowRight size={16} /></a></div></section>
    <section className="container how-it-works" aria-labelledby="workflow-title"><div className="section-heading"><div><h2 id="workflow-title">{t('How It Works')}</h2><p>{t('From a sample image to a clear, digital quality report.')}</p></div><span className="quiet-label">05 simple steps · Active policy {policy.version}</span></div><ol className="workflow">{steps.map(({ title, description, icon: Icon }, index) => <li key={title}><div className="workflow-icon"><Icon size={27} strokeWidth={1.5} /></div><div className="workflow-label"><span>0{index + 1}</span><h3>{t(title)}</h3></div><p>{t(description)}</p></li>)}</ol></section>
    <section className="container capabilities" aria-labelledby="capabilities-title"><div className="section-heading"><div><h2 id="capabilities-title">Platform Capabilities</h2><p>Grading, verification and edge modules integrated into one inspection workflow.</p></div></div><div className="capability-grid">{capabilities.map(({ title, description, icon: Icon, path, link }) => <div className="capability-card" key={title}><div className="capability-icon"><Icon size={24} strokeWidth={1.6} /></div><h3>{title}</h3><p>{description}</p><a className="text-link" href={`#${path}`}>{link}<ArrowRight size={15} /></a></div>)}</div></section>
    <section className="home-statistics" aria-labelledby="overview-title"><div className="container"><div className="section-heading"><div><h2 id="overview-title">{t('Assessment Overview')}</h2><p>{t('An at-a-glance view of the demonstration dataset.')}</p></div><a href="#/dashboard" className="text-link">{t('View all assessments')}<ArrowRight size={16} /></a></div><StatGrid stats={[
      { label: 'Total Batches', value: records.length, icon: Boxes },
      { label: 'Onions Analysed', value: total, icon: CheckCheck },
      { label: 'Grade A', value: Math.round(quality.gradeA), suffix: '%', icon: CircleCheck },
      { label: 'URS', value: Math.round(quality.urs), suffix: '%', icon: SlidersHorizontal },
    ]} /></div></section>
  </div>;
}
