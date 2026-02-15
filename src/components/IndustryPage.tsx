import { useEffect } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { applyPageSeo } from '../utils/seoHelper';
import './IndustryPage.css';
import constructionMain from '../../assets/images/constructimg.jpg';
import constructionSupport from '../../assets/images/supportconstruct.jpg';
import constructionMainWebp from '../../assets/images/constructimg.webp';
import constructionSupportWebp from '../../assets/images/supportconstruct.webp';
import officeMain from '../../assets/images/officemain.jpg';
import officeSupport from '../../assets/images/officesupport.jpg';
import officeMainWebp from '../../assets/images/officemain.webp';
import officeSupportWebp from '../../assets/images/officesupport.webp';
import clinicMain from '../../assets/images/clinicmain.jpg';
import clinicSupport from '../../assets/images/clinicsupport.jpg';
import clinicMainWebp from '../../assets/images/clinicmain.webp';
import clinicSupportWebp from '../../assets/images/clinicsupport.webp';
import coworkMain from '../../assets/images/coworkmain.jpg';
import coworkSupport from '../../assets/images/coworksupport.jpg';
import coworkMainWebp from '../../assets/images/coworkmain.webp';
import coworkSupportWebp from '../../assets/images/coworksupport.webp';

type IndustryKey = 'construction' | 'offices' | 'healthcare' | 'coworking';

interface IndustryPageProps {
  industry: IndustryKey;
  onNavigate: (page: string) => void;
}

type IndustryContent = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  bullets: string[];
  supportingTitle: string;
  supportingCopy: string;
  mainImage: string;
  supportImage: string;
  mainImageWebp: string;
  supportImageWebp: string;
  mainImageAlt: string;
  supportImageAlt: string;
};

const INDUSTRY_CONTENT: Record<IndustryKey, IndustryContent> = {
  construction: {
    slug: 'construction',
    metaTitle: 'Construction Site Visitor Log Software | Floinvite',
    metaDescription:
      'Replace paper sign-in sheets with a construction site visitor log and site access management workflow built for fast-moving contractors.',
    eyebrow: 'Construction',
    headline: 'Construction Site Visitor Log and Site Access Management',
    subheadline:
      'Track every contractor and visitor in real time. Keep daily records exportable for payroll, safety checks, and audits.',
    bullets: [
      'Digital construction site visitor log with instant check-in and check-out.',
      'Live on-site list for supervisors and emergency accountability.',
      'Daily and weekly export reports for compliance and payroll support.',
    ],
    supportingTitle: 'Built for active jobsites',
    supportingCopy:
      'Floinvite helps site teams capture arrivals without slowing operations. You get clean records, quick searches, and proof of site access when needed.',
    mainImage: constructionMain,
    supportImage: constructionSupport,
    mainImageWebp: constructionMainWebp,
    supportImageWebp: constructionSupportWebp,
    mainImageAlt: 'Construction site access workflow with supervisor and contractor check-in',
    supportImageAlt: 'Construction team records and arrival management at site entrance',
  },
  offices: {
    slug: 'offices',
    metaTitle: 'Office Visitor Management System | Guest Check In | Floinvite',
    metaDescription:
      'Modern office visitor management with a fast guest check in system, host alerts, and a searchable visitor log for front desks and admins.',
    eyebrow: 'Offices',
    headline: 'Office Visitor Management and Guest Check In System',
    subheadline:
      'Give front desk teams a simple, fast workflow for every guest arrival while keeping records organized and export-ready.',
    bullets: [
      'Streamlined office visitor management for reception and operations teams.',
      'Guest check in system with immediate host notification.',
      'Searchable visitor history for security, reporting, and audits.',
    ],
    supportingTitle: 'Designed for busy reception flow',
    supportingCopy:
      'From customer meetings to delivery drop-offs, Floinvite captures every arrival consistently so teams can move faster and stay informed.',
    mainImage: officeMain,
    supportImage: officeSupport,
    mainImageWebp: officeMainWebp,
    supportImageWebp: officeSupportWebp,
    mainImageAlt: 'Office reception desk handling guest check-in and host notifications',
    supportImageAlt: 'Office visitor management process at front desk',
  },
  healthcare: {
    slug: 'healthcare',
    metaTitle: 'Clinic Patient Check In and HIPAA Visitor Log | Floinvite',
    metaDescription:
      'Support clinic patient check in with secure workflows and a HIPAA visitor log process designed for healthcare environments.',
    eyebrow: 'Healthcare',
    headline: 'Clinic Patient Check In and HIPAA Visitor Log Workflow',
    subheadline:
      'Create clear, time-stamped check-in records and keep access data organized for healthcare operations and compliance teams.',
    bullets: [
      'Clinic patient check in flow optimized for speed at reception.',
      'HIPAA visitor log process with searchable, exportable records.',
      'Role-based visibility that supports operational and compliance reviews.',
    ],
    supportingTitle: 'Structured for regulated environments',
    supportingCopy:
      'Floinvite keeps patient and visitor access records easy to retrieve while reducing paper handling and manual entry.',
    mainImage: clinicMain,
    supportImage: clinicSupport,
    mainImageWebp: clinicMainWebp,
    supportImageWebp: clinicSupportWebp,
    mainImageAlt: 'Clinic reception using digital patient and visitor check-in workflow',
    supportImageAlt: 'Healthcare visitor log support process at clinic desk',
  },
  coworking: {
    slug: 'coworking',
    metaTitle: 'Coworking Space Management and Member Check In | Floinvite',
    metaDescription:
      'Run coworking space management with fast member check in, visitor tracking, and clean logs for operators managing shared workplaces.',
    eyebrow: 'Coworking',
    headline: 'Coworking Space Management with Member Check In',
    subheadline:
      'Handle members, guests, and day-pass traffic with one lightweight check-in workflow that stays audit-ready.',
    bullets: [
      'Coworking space management across members, guests, and visitors.',
      'Fast member check in flow with clear time-stamped records.',
      'Export-ready logs for operations, billing checks, and compliance.',
    ],
    supportingTitle: 'Made for shared workspace operations',
    supportingCopy:
      'Floinvite supports daily desk traffic without extra hardware, helping community managers keep access smooth and records reliable.',
    mainImage: coworkMain,
    supportImage: coworkSupport,
    mainImageWebp: coworkMainWebp,
    supportImageWebp: coworkSupportWebp,
    mainImageAlt: 'Coworking space member and guest check-in management at entrance',
    supportImageAlt: 'Coworking operations team tracking member arrivals and visitor flow',
  },
};

export function IndustryPage({ industry, onNavigate }: IndustryPageProps) {
  const content = INDUSTRY_CONTENT[industry];

  useEffect(() => {
    return applyPageSeo({
      title: content.metaTitle,
      canonicalUrl: `https://floinvite.com/${content.slug}`,
      metas: [
        { selector: 'meta[name="description"]', attr: 'name', key: 'description', content: content.metaDescription },
        { selector: 'meta[property="og:title"]', attr: 'property', key: 'og:title', content: content.metaTitle },
        {
          selector: 'meta[property="og:description"]',
          attr: 'property',
          key: 'og:description',
          content: content.metaDescription
        },
        { selector: 'meta[property="og:url"]', attr: 'property', key: 'og:url', content: `https://floinvite.com/${content.slug}` },
        { selector: 'meta[name="twitter:title"]', attr: 'name', key: 'twitter:title', content: content.metaTitle },
        {
          selector: 'meta[name="twitter:description"]',
          attr: 'name',
          key: 'twitter:description',
          content: content.metaDescription
        },
        { selector: 'meta[name="twitter:url"]', attr: 'name', key: 'twitter:url', content: `https://floinvite.com/${content.slug}` }
      ]
    });
  }, [content]);

  return (
    <main className="marketing-page industry-page">
      <header className="marketing-header">
        <div className="container industry-header-content">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('landing');
            }}
            className="marketing-brand-button industry-brand-button"
            title="Back to home"
            aria-label="Floinvite home"
          >
            <h1 className="marketing-brand-text brand-wordmark">
              <span className="brand-wordmark-flo">flo</span>
              <span className="brand-wordmark-invite">invite</span>
            </h1>
          </a>
          <nav className="industry-nav" aria-label="Industry page navigation">
            <a href="/features" onClick={(e) => { e.preventDefault(); onNavigate('marketing'); }}>Features</a>
            <a href="/offices" onClick={(e) => { e.preventDefault(); onNavigate('offices'); }}>Offices</a>
            <a href="/construction" onClick={(e) => { e.preventDefault(); onNavigate('construction'); }}>Construction</a>
            <a href="/healthcare" onClick={(e) => { e.preventDefault(); onNavigate('healthcare'); }}>Healthcare</a>
            <a href="/coworking" onClick={(e) => { e.preventDefault(); onNavigate('coworking'); }}>Coworking</a>
          </nav>
        </div>
      </header>

      <section className="industry-hero">
        <div className="container">
          <div className="industry-eyebrow">{content.eyebrow}</div>
          <h1 className="industry-title">{content.headline}</h1>
          <p className="industry-subtitle">{content.subheadline}</p>

          <div className="industry-cta-row">
            <a
              href="/register"
              className="btn btn-primary btn-lg fw-semibold"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('createaccount');
              }}
            >
              Start Free <ArrowRight size={18} />
            </a>
            <a
              href="/pricing"
              className="btn btn-outline-primary btn-lg fw-semibold"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('pricing');
              }}
            >
              View Pricing
            </a>
          </div>

          <div className="industry-hero-image-wrap">
            <picture>
              <source srcSet={content.mainImageWebp} type="image/webp" />
              <img src={content.mainImage} alt={content.mainImageAlt} className="industry-hero-image" loading="eager" />
            </picture>
          </div>
        </div>
      </section>

      <section className="industry-content">
        <div className="container">
          <div className="row g-4">
            {content.bullets.map((bullet) => (
              <div className="col-md-4 col-12" key={bullet}>
                <article className="industry-card">
                  <div className="industry-card-icon">
                    <CheckCircle2 size={20} />
                  </div>
                  <p>{bullet}</p>
                </article>
              </div>
            ))}
          </div>

          <article className="industry-supporting">
            <div className="industry-supporting-icon">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2>{content.supportingTitle}</h2>
              <p>{content.supportingCopy}</p>
            </div>
            <picture>
              <source srcSet={content.supportImageWebp} type="image/webp" />
              <img
                src={content.supportImage}
                alt={content.supportImageAlt}
                className="industry-support-image"
                loading="lazy"
              />
            </picture>
          </article>
        </div>
      </section>
    </main>
  );
}
