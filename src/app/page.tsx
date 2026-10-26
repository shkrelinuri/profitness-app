const programs = [
  {
    number: "01",
    title: "Strength",
    description: "Build confidence one strong, steady rep at a time.",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Strength training equipment in a modern gym",
    tag: "Lift with purpose",
  },
  {
    number: "02",
    title: "Conditioning",
    description: "Find your pace with training that meets you where you are.",
    image:
      "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Athlete running during a conditioning workout",
    tag: "Move with energy",
  },
  {
    number: "03",
    title: "Recovery",
    description: "Make room to reset, recharge, and come back stronger.",
    image:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "A calm studio prepared for a recovery session",
    tag: "Recover with care",
  },
];

const benefits = [
  {
    title: "Room to move",
    description: "Thoughtfully laid-out spaces for every kind of training day.",
    icon: "space",
  },
  {
    title: "People in your corner",
    description: "A welcoming community that makes showing up feel easier.",
    icon: "people",
  },
  {
    title: "Your pace, your plan",
    description: "Flexible ways to train, whether you're starting or starting over.",
    icon: "spark",
  },
];

const faqs = [
  {
    question: "Can I try the gym before joining?",
    answer:
      "Absolutely. Get in touch with the club team to arrange a visit and see if the space feels right for you.",
  },
  {
    question: "Do I need to be experienced to get started?",
    answer:
      "Not at all. Our club is for every level, and our team can help you find a comfortable place to begin.",
  },
  {
    question: "What should I bring for my first visit?",
    answer:
      "Bring comfortable workout clothes, training shoes, and a water bottle. The club team can help with anything else.",
  },
];

function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="arrow-icon"
      fill="none"
      viewBox="0 0 20 20"
    >
      {diagonal ? (
        <path d="M5 15 15 5M6 5h9v9" />
      ) : (
        <path d="M3.5 10h12m-5-5 5 5-5 5" />
      )}
    </svg>
  );
}

function BrandMark() {
  return (
    <a aria-label="ProFitness home" className="brand" href="#home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>
        PRO<span className="brand-accent">FIT</span>
        <small>TRAINING CLUB</small>
      </span>
    </a>
  );
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <div className="header-inner">
          <BrandMark />
          <nav aria-label="Main navigation" className="desktop-nav">
            <a href="#programs">Programs</a>
            <a href="#club">The club</a>
            <a href="#membership">Membership</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a className="button button-dark header-cta" href="#membership">
            Join the club <ArrowIcon diagonal />
          </a>
          <details className="mobile-menu">
            <summary aria-label="Open navigation menu">Menu</summary>
            <nav aria-label="Mobile navigation">
              <a href="#programs">Programs</a>
              <a href="#club">The club</a>
              <a href="#membership">Membership</a>
              <a href="#faq">FAQ</a>
            </nav>
          </details>
        </div>
      </header>

      <section aria-labelledby="hero-title" className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span /> A better kind of everyday</p>
          <h1 id="hero-title">
            Find your
            <br />
            <em>strong.</em>
          </h1>
          <p className="hero-description">
            A good gym is more than a place to work out. It is where you show
            up for yourself, find your rhythm, and feel at home doing it.
          </p>
          <div className="hero-actions">
            <a className="button button-lime" href="#programs">
              Explore programs <ArrowIcon />
            </a>
            <a className="text-link" href="#membership">
              View memberships <ArrowIcon />
            </a>
          </div>
          <div className="hero-note">
            <span className="note-line" />
            <span>Good energy. Great people. Your kind of progress.</span>
          </div>
        </div>
        <div
          aria-label="Athlete training with free weights in a gym"
          className="hero-image"
          role="img"
        >
          <div className="image-caption">
            <span className="caption-dot" />
            <span>Make space for your next chapter.</span>
          </div>
          <div className="hero-stamp">
            <span>SHOW UP</span>
            <span className="stamp-star">✳</span>
            <span>FEEL GOOD</span>
          </div>
        </div>
        <a aria-label="Scroll to programs" className="scroll-cue" href="#programs">
          <span>SCROLL TO EXPLORE</span>
          <span className="scroll-line" />
        </a>
      </section>

      <section aria-label="Our approach" className="ticker">
        <div className="ticker-track">
          <span>Move with purpose</span><i>✳</i><span>Find your people</span><i>✳</i>
          <span>Make it a habit</span><i>✳</i><span>Feel good doing it</span><i>✳</i>
          <span>Move with purpose</span><i>✳</i><span>Find your people</span><i>✳</i>
        </div>
      </section>

      <section aria-labelledby="programs-title" className="section programs" id="programs">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Find your way in</p>
            <h2 id="programs-title">A little bit of <em>everything.</em></h2>
          </div>
          <p className="section-intro">
            Whether you come to lift, move, or reset, there is space for you
            here. Start with what feels good.
          </p>
        </div>
        <div className="program-grid">
          {programs.map((program) => (
            <article className="program-card" key={program.number}>
              <div
                aria-label={program.imageAlt}
                className={`program-image program-image-${program.number}`}
                role="img"
              >
                <span className="program-tag">{program.tag}</span>
                <span className="program-number">{program.number}</span>
              </div>
              <div className="program-copy">
                <div>
                  <h3>{program.title}</h3>
                  <p>{program.description}</p>
                </div>
                <a aria-label={`Explore ${program.title}`} href="#membership">
                  <ArrowIcon diagonal />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="club-title" className="club-section" id="club">
        <div className="club-image" role="img" aria-label="Bright, welcoming gym floor">
          <div className="club-image-label">YOUR SPACE TO RESET & RECHARGE</div>
        </div>
        <div className="club-copy">
          <p className="eyebrow">More than a workout</p>
          <h2 id="club-title">
            Come as
            <br />
            <em>you are.</em>
          </h2>
          <p>
            No perfect routine required. Just a welcoming place, the right
            equipment, and people who are glad you made it in.
          </p>
          <ul className="benefit-list">
            {benefits.map((benefit) => (
              <li key={benefit.title}>
                <span className="benefit-icon" aria-hidden="true">
                  {benefit.icon === "space" && (
                    <svg viewBox="0 0 24 24" fill="none"><path d="M4 8V4h4M20 8V4h-4M4 16v4h4m12-4v4h-4M8 12h8m-4-4v8" /></svg>
                  )}
                  {benefit.icon === "people" && (
                    <svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1m1-14a3 3 0 0 1 0 6m2 2a5 5 0 0 1 3 5v1" /></svg>
                  )}
                  {benefit.icon === "spark" && (
                    <svg viewBox="0 0 24 24" fill="none"><path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3Zm7 12 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></svg>
                  )}
                </span>
                <span>
                  <strong>{benefit.title}</strong>
                  <span>{benefit.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="membership-title" className="membership" id="membership">
        <div className="membership-orbit" aria-hidden="true">✳</div>
        <p className="eyebrow">Your next chapter starts here</p>
        <h2 id="membership-title">
          Ready when
          <br />
          <em>you are.</em>
        </h2>
        <p className="membership-description">
          Come take a look around, meet the team, and find the membership that
          works for you.
        </p>
        <a className="button button-dark" href="mailto:hello@profitness.example?subject=Membership%20enquiry">
          Ask about membership <ArrowIcon diagonal />
        </a>
        <span className="membership-footnote">
          No pressure. Just a conversation about your goals.
        </span>
      </section>

      <section aria-labelledby="visit-title" className="visit-section">
        <div>
          <p className="eyebrow">Come say hello</p>
          <h2 id="visit-title">Find your <em>club.</em></h2>
          <p className="visit-copy">
            We would love to show you around. Get in touch and our team will
            help you plan your first visit.
          </p>
        </div>
        <div className="visit-details">
          <div>
            <span className="detail-label">VISIT</span>
            <p>Your local ProFitness club</p>
            <p>Contact us for directions</p>
          </div>
          <div>
            <span className="detail-label">OPENING HOURS</span>
            <p>Ask our team for current hours</p>
            <p>Hours may vary by location</p>
          </div>
          <a className="text-link" href="mailto:hello@profitness.example">
            Contact the club <ArrowIcon />
          </a>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="faq-section" id="faq">
        <div className="faq-heading">
          <p className="eyebrow">A few good questions</p>
          <h2 id="faq-title">Good to <em>know.</em></h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details className="faq-item" key={faq.question}>
              <summary>
                <span>{faq.question}</span>
                <span className="faq-plus" aria-hidden="true">+</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-main">
          <div>
            <BrandMark />
            <p className="footer-tagline">A little stronger, a lot more you.</p>
          </div>
          <div className="footer-links">
            <a href="#programs">Programs</a>
            <a href="#club">The club</a>
            <a href="#membership">Membership</a>
            <a href="#faq">FAQ</a>
          </div>
          <a className="footer-contact" href="mailto:hello@profitness.example">
            Say hello <ArrowIcon diagonal />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© ProFitness Training Club</span>
          <span>Made for the everyday athlete.</span>
          <a href="mailto:hello@profitness.example?subject=Privacy%20policy%20request">
            Privacy & terms
          </a>
        </div>
      </footer>
    </main>
  );
}
