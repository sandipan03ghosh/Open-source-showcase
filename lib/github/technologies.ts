export type TechnologyCategory =
  | "FRAMEWORK"
  | "LIBRARY"
  | "DATABASE"
  | "CLOUD"
  | "DEVOPS";

/**
 * GitHub topic slugs are already close to canonical technology names, so we
 * detect technologies by intersecting a repo's topics against this curated
 * list instead of persisting a separate Technology table.
 */
const KNOWN_TECHNOLOGIES: Record<string, { name: string; category: TechnologyCategory }> = {
  react: { name: "React", category: "FRAMEWORK" },
  reactjs: { name: "React", category: "FRAMEWORK" },
  nextjs: { name: "Next.js", category: "FRAMEWORK" },
  vue: { name: "Vue.js", category: "FRAMEWORK" },
  vuejs: { name: "Vue.js", category: "FRAMEWORK" },
  nuxt: { name: "Nuxt", category: "FRAMEWORK" },
  angular: { name: "Angular", category: "FRAMEWORK" },
  svelte: { name: "Svelte", category: "FRAMEWORK" },
  sveltekit: { name: "SvelteKit", category: "FRAMEWORK" },
  django: { name: "Django", category: "FRAMEWORK" },
  flask: { name: "Flask", category: "FRAMEWORK" },
  fastapi: { name: "FastAPI", category: "FRAMEWORK" },
  rails: { name: "Ruby on Rails", category: "FRAMEWORK" },
  laravel: { name: "Laravel", category: "FRAMEWORK" },
  express: { name: "Express", category: "FRAMEWORK" },
  expressjs: { name: "Express", category: "FRAMEWORK" },
  nestjs: { name: "NestJS", category: "FRAMEWORK" },
  spring: { name: "Spring", category: "FRAMEWORK" },
  "spring-boot": { name: "Spring Boot", category: "FRAMEWORK" },
  flutter: { name: "Flutter", category: "FRAMEWORK" },
  "react-native": { name: "React Native", category: "FRAMEWORK" },

  redux: { name: "Redux", category: "LIBRARY" },
  tailwindcss: { name: "Tailwind CSS", category: "LIBRARY" },
  vite: { name: "Vite", category: "LIBRARY" },
  webpack: { name: "Webpack", category: "LIBRARY" },
  graphql: { name: "GraphQL", category: "LIBRARY" },
  prisma: { name: "Prisma", category: "LIBRARY" },
  pytorch: { name: "PyTorch", category: "LIBRARY" },
  tensorflow: { name: "TensorFlow", category: "LIBRARY" },
  pandas: { name: "pandas", category: "LIBRARY" },
  numpy: { name: "NumPy", category: "LIBRARY" },

  postgresql: { name: "PostgreSQL", category: "DATABASE" },
  postgres: { name: "PostgreSQL", category: "DATABASE" },
  mysql: { name: "MySQL", category: "DATABASE" },
  mongodb: { name: "MongoDB", category: "DATABASE" },
  redis: { name: "Redis", category: "DATABASE" },
  sqlite: { name: "SQLite", category: "DATABASE" },
  elasticsearch: { name: "Elasticsearch", category: "DATABASE" },
  supabase: { name: "Supabase", category: "DATABASE" },
  firebase: { name: "Firebase", category: "DATABASE" },

  aws: { name: "AWS", category: "CLOUD" },
  "amazon-web-services": { name: "AWS", category: "CLOUD" },
  gcp: { name: "Google Cloud", category: "CLOUD" },
  "google-cloud": { name: "Google Cloud", category: "CLOUD" },
  azure: { name: "Azure", category: "CLOUD" },
  vercel: { name: "Vercel", category: "CLOUD" },
  netlify: { name: "Netlify", category: "CLOUD" },
  cloudflare: { name: "Cloudflare", category: "CLOUD" },
  heroku: { name: "Heroku", category: "CLOUD" },

  docker: { name: "Docker", category: "DEVOPS" },
  kubernetes: { name: "Kubernetes", category: "DEVOPS" },
  k8s: { name: "Kubernetes", category: "DEVOPS" },
  terraform: { name: "Terraform", category: "DEVOPS" },
  "github-actions": { name: "GitHub Actions", category: "DEVOPS" },
  "ci-cd": { name: "CI/CD", category: "DEVOPS" },
  jenkins: { name: "Jenkins", category: "DEVOPS" },
  ansible: { name: "Ansible", category: "DEVOPS" },
  nginx: { name: "Nginx", category: "DEVOPS" },
};

export function detectTechnologies(topics: string[]): string[] {
  const matched = new Set<string>();
  for (const topic of topics) {
    const entry = KNOWN_TECHNOLOGIES[topic.toLowerCase()];
    if (entry) matched.add(entry.name);
  }
  return Array.from(matched);
}

export function categoryForTechnology(name: string): TechnologyCategory | null {
  const entry = Object.values(KNOWN_TECHNOLOGIES).find((t) => t.name === name);
  return entry?.category ?? null;
}
