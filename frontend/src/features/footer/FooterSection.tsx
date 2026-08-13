import { ArrowRight, Globe2, Mail, Network, Send } from 'lucide-react'

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
    <footer className="mt-10 bg-slate-950 text-slate-300" aria-labelledby="footer-heading">
      <section className="mx-auto flex max-w-400 flex-wrap items-center justify-between gap-5 border-b border-white/10 px-6 py-10 sm:px-8" aria-labelledby="footer-heading">
        <div>
          <h2 className="text-2xl font-bold text-white" id="footer-heading">Ready to build better SRS documents?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Join teams that trust SRS Platform to streamline requirements and accelerate delivery.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-400" href="#projects">
            Get Started
            <ArrowRight size={17} />
          </a>
          <a className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10" href="mailto:hello@srsplatform.com">Book Demo</a>
        </div>
      </section>

      <section className="mx-auto grid max-w-400 gap-8 px-6 py-10 sm:px-8 xl:grid-cols-[1.25fr_2fr_1fr]" aria-label="Footer navigation">
        <div>
          <a className="flex items-center gap-2 text-white" href="#overview" aria-label="SRS Platform home"><span className="grid size-9 place-items-center rounded-lg bg-brand-500"><Network size={20} /></span><strong className="text-lg">SRS Platform</strong>
          </a>
          <p className="mt-4 text-sm leading-6 text-slate-400">The all-in-one platform to manage requirements, diagrams, and documentation with AI-powered automation.</p>
          <a className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white" href="mailto:hello@srsplatform.com">
            <Mail size={17} />
            hello@srsplatform.com
          </a>
          <div className="mt-5 flex gap-2" aria-label="Social links">
            {socialLinks.map((label) => (
              <a className="grid size-8 place-items-center rounded-full bg-white/10 text-xs font-bold text-white hover:bg-brand-500" href="#overview" key={label} aria-label={`${label} social link`}>{label}</a>
            ))}
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-7 sm:grid-cols-4" aria-label="Footer links">
          {footerGroups.map((group) => (
            <div className="grid content-start gap-2" key={group.title}>
              <h3 className="mb-1 text-sm font-bold text-white">{group.title}</h3>
              {group.links.map((link) => (
                <a className="flex items-center gap-1 text-sm text-slate-400 hover:text-white" href="#overview" key={link}>
                  {link}
                  <ArrowRight size={13} />
                </a>
              ))}
            </div>
          ))}
        </nav>

        <section id="contact" aria-labelledby="footer-newsletter-heading">
          <h3 className="text-sm font-bold text-white" id="footer-newsletter-heading">Stay in the loop</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">Get the latest updates, product news, and best practices delivered to your inbox.</p>
          <form className="mt-4 flex" onSubmit={(event) => event.preventDefault()}>
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-l-lg bg-white px-3 text-slate-400">
              <span className="sr-only">Email address</span>
              <Mail size={17} />
              <input className="min-w-0 flex-1 py-2.5 text-sm text-slate-800 outline-none" type="email" placeholder="Enter your email" />
            </label>
            <button className="grid w-11 place-items-center rounded-r-lg bg-brand-500 text-white hover:bg-brand-400" type="submit" aria-label="Subscribe">
              <Send size={17} />
            </button>
          </form>
        </section>
      </section>

      <div className="mx-auto flex max-w-400 flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-5 text-xs text-slate-500 sm:px-8">
        <span>&copy; 2025 SRS Platform, Inc. All rights reserved.</span>
        <nav className="flex gap-4" aria-label="Legal shortcuts">
          <a href="#overview">Privacy</a>
          <a href="#overview">Terms</a>
          <a href="#overview">Cookies</a>
        </nav>
        <button type="button" className="flex items-center gap-1 rounded px-2 py-1 text-slate-300 hover:bg-white/10">
          <Globe2 size={16} />
          English
          <ArrowRight size={13} />
        </button>
      </div>
    </footer>
  )
}
