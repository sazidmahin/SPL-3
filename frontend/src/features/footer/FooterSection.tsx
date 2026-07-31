import { ArrowRight, Globe2, Mail, Network, Send } from 'lucide-react'
import './FooterSection.css'

const footerGroups = [
  {
    title: 'Product',
    links: ['Features', 'Projects', 'Requirements', 'Diagrams', 'AI Jobs', 'Pricing'],
  },
  {
    title: 'Resources',
    links: ['Documentation', 'Help Center', 'Blog', 'Templates', 'Webinars', 'Release Notes'],
  },
  {
    title: 'Company',
    links: ['About Us', 'Careers', 'Contact Us', 'Partners', 'Customers', 'Trust & Security'],
  },
  {
    title: 'Legal',
    links: ['Privacy Policy', 'Terms of Service', 'Security', 'Data Processing Agreement', 'Cookie Policy', 'Compliance'],
  },
]

const socialLinks = ['in', 'X', 'yt', 'gh']

export function FooterSection() {
  return (
    <footer className="footer-section" aria-labelledby="footer-heading">
      <section className="footer-cta" aria-labelledby="footer-heading">
        <div>
          <h2 id="footer-heading">Ready to build better SRS documents?</h2>
          <p>Join teams that trust SRS Platform to streamline requirements and accelerate delivery.</p>
        </div>
        <div className="footer-cta-actions">
          <a className="footer-primary-action" href="#projects">
            Get Started
            <ArrowRight size={17} />
          </a>
          <a className="footer-secondary-action" href="mailto:hello@srsplatform.com">Book Demo</a>
        </div>
      </section>

      <section className="footer-main" aria-label="Footer navigation">
        <div className="footer-brand-column">
          <a className="footer-brand" href="#overview" aria-label="SRS Platform home">
            <span><Network size={23} /></span>
            <strong>SRS Platform</strong>
          </a>
          <p>The all-in-one platform to manage requirements, diagrams, and documentation with AI-powered automation.</p>
          <a className="footer-contact" href="mailto:hello@srsplatform.com">
            <Mail size={17} />
            hello@srsplatform.com
          </a>
          <div className="footer-socials" aria-label="Social links">
            {socialLinks.map((label) => (
              <a href="#overview" key={label} aria-label={`${label} social link`}>{label}</a>
            ))}
          </div>
        </div>

        <nav className="footer-link-grid" aria-label="Footer links">
          {footerGroups.map((group) => (
            <div className="footer-link-column" key={group.title}>
              <h3>{group.title}</h3>
              {group.links.map((link) => (
                <a href="#overview" key={link}>
                  {link}
                  <ArrowRight size={13} />
                </a>
              ))}
            </div>
          ))}
        </nav>

        <section className="footer-newsletter" id="contact" aria-labelledby="footer-newsletter-heading">
          <h3 id="footer-newsletter-heading">Stay in the loop</h3>
          <p>Get the latest updates, product news, and best practices delivered to your inbox.</p>
          <form className="footer-newsletter-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              <span className="sr-only">Email address</span>
              <Mail size={17} />
              <input type="email" placeholder="Enter your email" />
            </label>
            <button type="submit" aria-label="Subscribe">
              <Send size={17} />
            </button>
          </form>
        </section>
      </section>

      <div className="footer-bottom">
        <span>&copy; 2025 SRS Platform, Inc. All rights reserved.</span>
        <nav aria-label="Legal shortcuts">
          <a href="#overview">Privacy</a>
          <a href="#overview">Terms</a>
          <a href="#overview">Cookies</a>
        </nav>
        <button type="button" className="footer-language">
          <Globe2 size={16} />
          English
          <ArrowRight size={13} />
        </button>
      </div>
    </footer>
  )
}
