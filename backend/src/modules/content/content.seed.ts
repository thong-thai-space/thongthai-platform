import {
  ARCHITECTURE_DIAGRAM_PROMPT,
  CLIENT_ASSISTANT_PROMPT,
  CODE_REVIEW_PROMPT,
  ESTIMATE_PROMPT,
  GENERAL_ASSISTANT_PROMPT,
  PROFESSIONAL_OUTPUT_RULES,
  PROGRESS_REPORT_PROMPT,
  PROPOSAL_PROMPT,
  PUBLIC_FAQ_PROMPT,
  STRATEGIC_PLAN_PROMPT,
  TASK_BREAKDOWN_PROMPT,
} from '../ai/prompts';

// Pattern: Seed data — kept out of business code; mutable per environment.
// The DEFAULT_CONTENT_EN map below holds the English-source payloads in their
// natural flat shape (easier to edit). DEFAULT_CONTENT (exported at bottom)
// wraps each entry in the per-locale envelope `{ en: <body>, vi: null }` so
// the frontend's i18n fallback covers Vietnamese until an admin customises it
// through the dashboard's locale tabs.
const DEFAULT_CONTENT_EN: Record<string, object> = {
  hero: {
    badge: 'Smart technology solutions',
    title: 'Turn ideas into',
    titleHighlight: 'outstanding digital',
    titleEnd: 'products',
    subtitle:
      'Thong Thai Space specializes in Web & App development, AI integration, and IT consulting. Our expert team helps businesses digitize processes and achieve sustainable growth.',
    youtubeVideoUrl: '',
    primaryCta: { text: 'Get a free quote', href: '/contact' },
    secondaryCta: { text: 'View our projects', href: '/portfolio' },
    stats: [
      { value: '50+', label: 'Projects completed' },
      { value: '30+', label: 'Trusted clients' },
      { value: '5+', label: 'Years of experience' },
      { value: '99%', label: 'Client satisfaction' },
    ],
  },
  services: {
    title: 'Our Services',
    subtitle:
      'Comprehensive technology solutions, from idea to finished product',
    items: [
      {
        icon: 'Globe',
        title: 'Web Development',
        description:
          'Websites, web apps, and e-commerce with modern technology: Next.js, React, Node.js. SEO and performance optimized.',
        features: [
          'Landing page',
          'Web application',
          'E-commerce',
          'Admin dashboard',
        ],
      },
      {
        icon: 'Smartphone',
        title: 'Mobile Apps',
        description:
          'iOS & Android apps with React Native and Flutter. Beautiful UI/UX design with smooth user experience.',
        features: [
          'iOS & Android',
          'Cross-platform',
          'UI/UX Design',
          'App Store publish',
        ],
      },
      {
        icon: 'Brain',
        title: 'AI Solutions',
        description:
          'Integrate AI into business processes: chatbots, data analysis, workflow automation.',
        features: [
          'AI Chatbot',
          'Data Analytics',
          'Process Automation',
          'NLP Solutions',
        ],
      },
      {
        icon: 'MessageSquare',
        title: 'IT Consulting',
        description:
          'Digital transformation strategy, system architecture, and technology selection for your business.',
        features: [
          'Digital Strategy',
          'System Architecture',
          'Tech Audit',
          'Team Training',
        ],
      },
    ],
  },
  process: {
    title: 'Our Process',
    subtitle: '4 simple steps from idea to finished product',
    steps: [
      {
        icon: 'MessageSquare',
        step: '01',
        title: 'Discuss & Analyze',
        description:
          'Listen to requirements, analyze business needs, and recommend the best technology solution.',
      },
      {
        icon: 'Lightbulb',
        step: '02',
        title: 'Design & Plan',
        description:
          'UI/UX design, system architecture, detailed cost estimation and timeline.',
      },
      {
        icon: 'Code',
        step: '03',
        title: 'Develop & Test',
        description:
          'Agile development process, thorough testing, and continuous progress updates.',
      },
      {
        icon: 'Rocket',
        step: '04',
        title: 'Deploy & Support',
        description:
          'Product launch, usage training, long-term maintenance and technical support.',
      },
    ],
  },
  testimonials: {
    title: 'What our clients say',
    subtitle: 'Feedback from clients who have trusted and partnered with us',
    items: [
      {
        name: 'Nguyen Minh Tuan',
        role: 'CEO, TechStart Vietnam',
        content:
          'Thong Thai Space helped us build a SaaS platform from scratch. The team is very professional, communicates well and always delivers on schedule.',
        rating: 5,
      },
      {
        name: 'Tran Thu Ha',
        role: 'Founder, BeautyBox',
        content:
          'Our e-commerce website revenue increased 300% after being redesigned by Thong Thai. Beautiful UI, fast performance, and our customers love it.',
        rating: 5,
      },
      {
        name: 'Le Duc Anh',
        role: 'CTO, LogiCorp',
        content:
          'The AI analytics solution helped us optimize 40% of shipping costs. Very impressed with the technical capabilities and problem-solving approach of the team.',
        rating: 5,
      },
    ],
  },
  cta: {
    title: 'Ready to start your project?',
    subtitle:
      'Contact us now for a free consultation and detailed quote for your project. Our expert team will respond within 24 hours.',
    primaryCta: { text: 'Get a quote', href: '/contact' },
    secondaryCta: { text: 'Explore services', href: '/services' },
  },
  footer: {
    brand: {
      name: 'Thong Thai Space',
      description:
        'Smart technology solutions for businesses. Specializing in Web, App, AI development and IT consulting.',
      email: 'contact@thongthai.space',
      phone: '0123 456 789',
      address: 'Ho Chi Minh City, Vietnam',
    },
    links: {
      Services: [
        { href: '/services#web', label: 'Web Development' },
        { href: '/services#app', label: 'Mobile Apps' },
        { href: '/services#ai', label: 'AI Solutions' },
        { href: '/services#consulting', label: 'IT Consulting' },
      ],
      Company: [
        { href: '/about', label: 'About' },
        { href: '/portfolio', label: 'Portfolio' },
        { href: '/contact', label: 'Contact' },
      ],
      Support: [
        { href: '/login', label: 'Sign in' },
        { href: '/register', label: 'Sign up' },
      ],
    },
  },
  portfolio: {
    hero: {
      title: 'Featured Projects',
      titleHighlight: 'Projects',
      subtitle:
        'Products we are proud to have built with our clients from concept to reality',
    },
    categories: ['All', 'Web', 'Mobile', 'AI', 'Web + Mobile'],
    items: [
      {
        title: 'E-Commerce Platform',
        client: 'Fashion Brand',
        category: 'Web',
        description:
          'E-commerce platform with inventory management, online payments, and analytics dashboard.',
        techStack: ['Next.js', 'Node.js', 'PostgreSQL', 'Stripe', 'Redis'],
        results: 'Increased online revenue by 300% in the first 3 months.',
      },
      {
        title: 'Healthcare Booking App',
        client: 'MedTech Startup',
        category: 'Mobile',
        description:
          'Appointment booking and online health consultation app for a clinic chain.',
        techStack: ['React Native', 'NestJS', 'PostgreSQL', 'Socket.IO'],
        results: '10,000+ downloads in the first month, 4.8-star rating.',
      },
      {
        title: 'AI Analytics Dashboard',
        client: 'Logistics Corp',
        category: 'AI',
        description:
          'Shipping data analytics dashboard with AI-powered trend prediction and route optimization.',
        techStack: ['React', 'Python', 'TensorFlow', 'D3.js', 'PostgreSQL'],
        results: 'Reduced shipping costs by 40%, saving $80,000/year.',
      },
      {
        title: 'Restaurant Management System',
        client: 'Food Chain',
        category: 'Web',
        description:
          'Restaurant management system: orders, inventory, staffing, and revenue reports.',
        techStack: ['Next.js', 'NestJS', 'PostgreSQL', 'Redis', 'Docker'],
        results:
          'Deployed across 15 branches, reducing order processing time by 50%.',
      },
      {
        title: 'Real Estate Platform',
        client: 'Property Group',
        category: 'Web',
        description:
          'Real estate listing platform with interactive maps, smart search, and chat.',
        techStack: ['Next.js', 'Node.js', 'MongoDB', 'Mapbox', 'Socket.IO'],
        results: '5,000+ listings, 50,000 monthly visits.',
      },
      {
        title: 'Education LMS',
        client: 'EdTech Startup',
        category: 'Web + Mobile',
        description:
          'Online learning management system with video streaming, quizzes, and AI tutor features.',
        techStack: ['React', 'React Native', 'NestJS', 'OpenAI', 'AWS S3'],
        results: '2,000+ students, course completion rate increased by 60%.',
      },
    ],
    cta: {
      title: 'Want a similar product?',
      subtitle: 'Tell us your idea and get a free quote.',
      buttonText: 'Get a quote',
      buttonHref: '/contact',
    },
  },
  about: {
    hero: {
      title: 'About Thong Thai Space',
      subtitle:
        'We are a team of technology experts specializing in Web, App, AI development and IT consulting for small and medium businesses. Our mission is to help businesses achieve effective digital transformation with affordable costs and international quality standards.',
    },
    valuesTitle: 'Core Values',
    values: [
      {
        icon: 'Target',
        title: 'Quality',
        description:
          'Committed to high-quality products, clean code, great performance, and security.',
      },
      {
        icon: 'Users',
        title: 'Partnership',
        description:
          "Not just a vendor, but a long-term partner committed to our clients' success.",
      },
      {
        icon: 'Heart',
        title: 'Dedication',
        description:
          "We listen, understand, and put our clients' interests first in every project.",
      },
      {
        icon: 'Award',
        title: 'Innovation',
        description:
          'Constantly adopting new technologies and applying creative solutions to every challenge.',
      },
    ],
    teamTitle: 'Our Team',
    teamSubtitle: 'The people behind every successful project',
    team: [
      {
        name: 'Thong Thai',
        role: 'Founder & CEO',
        bio: 'Full-stack developer with 5+ years of experience, passionate about AI and automation.',
      },
      {
        name: 'Team Dev',
        role: 'Development Team',
        bio: 'Experienced software engineers specializing in Web, Mobile, and AI.',
      },
      {
        name: 'Team Design',
        role: 'UI/UX Design',
        bio: 'Creating beautiful interfaces and optimal user experiences.',
      },
    ],
  },
  servicesPage: {
    hero: {
      title: 'Technology Services',
      titleHighlight: 'Services',
      subtitle:
        'End-to-end solutions from design, development to deployment and operations. We partner with you through every stage.',
    },
    cta: {
      title: 'Which solution do you need?',
      subtitle: 'Contact us now for a free consultation and detailed quote.',
      buttonText: 'Contact us',
      buttonHref: '/contact',
    },
  },
  contact: {
    hero: {
      title: 'Contact Us',
      titleHighlight: 'Us',
      subtitle:
        'Describe your project requirements, and we will provide a free consultation and quote within 24 hours',
    },
    infoTitle: 'Contact Information',
    info: {
      emailLabel: 'Email',
      email: 'contact@thongthai.space',
      phoneLabel: 'Phone',
      phone: '0123 456 789',
      addressLabel: 'Address',
      address: 'Ho Chi Minh City, Vietnam',
    },
    responseCard: {
      title: 'Response Time',
      body: 'We will get back to you within 24 business hours. For urgent requests, please call us directly.',
    },
    form: {
      submitText: 'Submit Request',
      sendingText: 'Sending...',
      successTitle: 'Thank you!',
      successSubtitle:
        'We have received your message and will respond within 24 hours.',
      errorText: 'An error occurred. Please try again later.',
    },
  },
  header: {
    navLinks: [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About' },
      { href: '/services', label: 'Services' },
      { href: '/portfolio', label: 'Portfolio' },
      { href: '/blog', label: 'Blog' },
      { href: '/contact', label: 'Contact' },
    ],
    ctaText: 'Get in touch',
    signInText: 'Sign in',
  },
  'ai-prompts': {
    generalAssistant: GENERAL_ASSISTANT_PROMPT,
    clientAssistant: CLIENT_ASSISTANT_PROMPT,
    publicFaq: PUBLIC_FAQ_PROMPT,
    proposal: PROPOSAL_PROMPT,
    taskBreakdown: TASK_BREAKDOWN_PROMPT,
    codeReview: CODE_REVIEW_PROMPT,
    estimate: ESTIMATE_PROMPT,
    progressReport: PROGRESS_REPORT_PROMPT,
    strategicPlan: STRATEGIC_PLAN_PROMPT,
    architectureDiagram: ARCHITECTURE_DIAGRAM_PROMPT,
    professionalOutputRules: PROFESSIONAL_OUTPUT_RULES,
  },
  'ai-ui': {
    dashboardAiChatEmptyState:
      'Ask the AI assistant a question. I can help you with coding, project consulting, code review...',
    dashboardAiChatInputPlaceholder:
      'Type a message... (Enter to send, Shift+Enter for new line)',
    publicChatOnlineTitle: 'AI Assistant is online',
    publicChatOnlineSubtitle: 'Need help? Ask me anything about our services.',
    publicChatHeaderTitle: 'Thong Thai Space',
    publicChatHeaderSubtitle: 'AI Assistant',
    publicChatWelcomeTitle: 'Hello!',
    publicChatWelcomeBody:
      "I'm the AI assistant of Thong Thai Space. Do you have any questions about our services?",
    publicChatInputPlaceholder: 'Ask about our services...',
    portalChatOnlineTitle: 'AI Assistant is online',
    portalChatOnlineSubtitle:
      'Ask about projects, invoices, or progress updates.',
    portalChatHeaderTitle: 'AI Assistant',
    portalChatWelcomeBody: 'Hello! I can help you ask about your projects.',
    portalChatInputPlaceholder: 'Ask something...',
    architectureAgentBadge: 'Architecture Agent',
    architectureAgentInputPlaceholder:
      'How can I help your project today? Describe your requirements, upload a file, then click View Architecture...',
    architectureAgentGeneratingSteps: [
      'Analyzing project requirements...',
      'Designing system layers and data flow...',
      'Rendering architecture diagram...',
    ],
    architectureAgentCtaLabel: 'View Architecture',
    architectureAgentGeneratingLabel: 'Generating...',
    architectureAgentSynthesizingLabel: 'Synthesizing architecture review...',
  },
};

// Vietnamese payloads for sections whose UI strings are NOT covered by
// compile-time i18n (they are CMS-driven: architecture agent widget, nav,
// testimonials). Admins can further customise via the dashboard's VI locale tab.
const DEFAULT_CONTENT_VI: Partial<Record<string, object>> = {
  header: {
    navLinks: [
      { href: '/', label: 'Trang chủ' },
      { href: '/about', label: 'Giới thiệu' },
      { href: '/services', label: 'Dịch vụ' },
      { href: '/portfolio', label: 'Dự án' },
      { href: '/blog', label: 'Blog' },
      { href: '/contact', label: 'Liên hệ' },
    ],
    ctaText: 'Liên hệ ngay',
    signInText: 'Đăng nhập',
  },
  testimonials: {
    title: 'Khách hàng nói về chúng tôi',
    subtitle: 'Phản hồi từ những khách hàng đã tin tưởng và đồng hành cùng chúng tôi',
    items: [
      {
        name: 'Nguyễn Minh Tuấn',
        role: 'CEO, TechStart Vietnam',
        content:
          'Thông Thái Space đã giúp chúng tôi xây dựng nền tảng SaaS từ đầu. Đội ngũ rất chuyên nghiệp, giao tiếp tốt và luôn bàn giao đúng tiến độ.',
        rating: 5,
      },
      {
        name: 'Trần Thu Hà',
        role: 'Founder, BeautyBox',
        content:
          'Doanh thu website thương mại điện tử của chúng tôi tăng 300% sau khi được Thông Thái thiết kế lại. UI đẹp, hiệu năng nhanh và khách hàng rất thích.',
        rating: 5,
      },
      {
        name: 'Lê Đức Anh',
        role: 'CTO, LogiCorp',
        content:
          'Giải pháp phân tích AI giúp chúng tôi tối ưu 40% chi phí vận chuyển. Rất ấn tượng với năng lực kỹ thuật và cách tiếp cận giải quyết vấn đề của đội ngũ.',
        rating: 5,
      },
    ],
  },
  'ai-ui': {
    dashboardAiChatEmptyState:
      'Hỏi trợ lý AI một câu hỏi. Tôi có thể giúp bạn về lập trình, tư vấn dự án, review code...',
    dashboardAiChatInputPlaceholder:
      'Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)',
    publicChatOnlineTitle: 'Trợ lý AI đang trực tuyến',
    publicChatOnlineSubtitle: 'Cần hỗ trợ? Hỏi tôi bất cứ điều gì về dịch vụ của chúng tôi.',
    publicChatHeaderTitle: 'Thông Thái Space',
    publicChatHeaderSubtitle: 'Trợ lý AI',
    publicChatWelcomeTitle: 'Xin chào!',
    publicChatWelcomeBody:
      'Tôi là trợ lý AI của Thông Thái Space. Bạn có câu hỏi gì về dịch vụ của chúng tôi không?',
    publicChatInputPlaceholder: 'Hỏi về dịch vụ của chúng tôi...',
    portalChatOnlineTitle: 'Trợ lý AI đang trực tuyến',
    portalChatOnlineSubtitle: 'Hỏi về dự án, hóa đơn hoặc cập nhật tiến độ.',
    portalChatHeaderTitle: 'Trợ lý AI',
    portalChatWelcomeBody: 'Xin chào! Tôi có thể giúp bạn hỏi về các dự án của bạn.',
    portalChatInputPlaceholder: 'Hỏi điều gì đó...',
    architectureAgentBadge: 'Tư vấn kiến trúc AI',
    architectureAgentInputPlaceholder:
      'Dự án của bạn cần gì hôm nay? Mô tả yêu cầu, tải file lên rồi nhấn Xem kiến trúc...',
    architectureAgentGeneratingSteps: [
      'Đang phân tích yêu cầu dự án...',
      'Đang thiết kế các tầng hệ thống và luồng dữ liệu...',
      'Đang vẽ sơ đồ kiến trúc...',
    ],
    architectureAgentCtaLabel: 'Xem kiến trúc',
    architectureAgentGeneratingLabel: 'Đang tạo...',
    architectureAgentSynthesizingLabel: 'Đang tổng hợp kiến trúc...',
  },
};

// Pattern: Adapter — wraps each flat English payload into the per-locale envelope.
// Sections with an explicit VI entry in DEFAULT_CONTENT_VI get a fully-translated
// vi slice; all others stay vi: null so compile-time i18n messages cover them.
export const DEFAULT_CONTENT: Record<
  string,
  { en: object; vi: object | null }
> = Object.fromEntries(
  Object.entries(DEFAULT_CONTENT_EN).map(([section, payload]) => [
    section,
    { en: payload, vi: DEFAULT_CONTENT_VI[section] ?? null },
  ]),
);
