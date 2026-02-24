import { NextResponse } from 'next/server';
import portfolioApps from '@/data/portfolio-apps.json';

type PortfolioApp = {
  app_id: string;
  repo_url: string;
  status: string;
  build_health: 'green' | 'yellow' | 'red' | 'unknown';
  store_health: 'green' | 'yellow' | 'red' | 'unknown';
  domain_health: 'green' | 'yellow' | 'red' | 'unknown';
  health_url: string | null;
  public_url?: string | null;
};

type RuntimeHealth = 'up' | 'down' | 'unknown';
type CiHealth = 'green' | 'yellow' | 'red' | 'unknown';
type DomainHealth = 'green' | 'red' | 'unknown';

function withTimeout(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function checkRuntime(url: string | null): Promise<RuntimeHealth> {
  if (!url) return 'unknown';
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: withTimeout(6000),
    });
    return res.ok ? 'up' : 'down';
  } catch {
    return 'down';
  }
}

async function checkDomain(url: string | null | undefined): Promise<DomainHealth> {
  if (!url) return 'unknown';
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: withTimeout(6000),
    });
    return res.ok ? 'green' : 'red';
  } catch {
    return 'red';
  }
}

function parseGithubRepo(repoUrl: string): { owner: string; repo: string } | null {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/i, ''),
  };
}

function ciHealthFromRun(status?: string, conclusion?: string | null): CiHealth {
  if (!status) return 'unknown';
  if (status !== 'completed') return 'yellow';
  if (conclusion === 'success') return 'green';
  if (conclusion === 'failure' || conclusion === 'timed_out' || conclusion === 'cancelled' || conclusion === 'startup_failure') {
    return 'red';
  }
  return 'yellow';
}

async function checkGitHubCi(repoUrl: string): Promise<{
  ci_health: CiHealth;
  ci_status: string | null;
  ci_conclusion: string | null;
  ci_updated_at: string | null;
  ci_run_url: string | null;
}> {
  const parsed = parseGithubRepo(repoUrl);
  if (!parsed) {
    return {
      ci_health: 'unknown',
      ci_status: null,
      ci_conclusion: null,
      ci_updated_at: null,
      ci_run_url: null,
    };
  }

  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'birdir1-admin-panel',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/actions/runs?per_page=1`,
      {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: withTimeout(7000),
      }
    );

    if (!res.ok) {
      return {
        ci_health: 'unknown',
        ci_status: `HTTP_${res.status}`,
        ci_conclusion: null,
        ci_updated_at: null,
        ci_run_url: null,
      };
    }

    const json = (await res.json()) as {
      workflow_runs?: Array<{
        status?: string;
        conclusion?: string | null;
        updated_at?: string;
        html_url?: string;
      }>;
    };

    const run = json.workflow_runs?.[0];
    const ci_status = run?.status ?? null;
    const ci_conclusion = run?.conclusion ?? null;

    return {
      ci_health: ciHealthFromRun(ci_status ?? undefined, ci_conclusion),
      ci_status,
      ci_conclusion,
      ci_updated_at: run?.updated_at ?? null,
      ci_run_url: run?.html_url ?? null,
    };
  } catch {
    return {
      ci_health: 'unknown',
      ci_status: 'network_error',
      ci_conclusion: null,
      ci_updated_at: null,
      ci_run_url: null,
    };
  }
}

export async function GET() {
  const apps = portfolioApps as PortfolioApp[];

  const enriched = await Promise.all(
    apps.map(async (app) => {
      const [runtime, domain, ci] = await Promise.all([
        checkRuntime(app.health_url),
        checkDomain(app.public_url),
        checkGitHubCi(app.repo_url),
      ]);

      const buildHealth: CiHealth =
        ci.ci_health !== 'unknown' ? ci.ci_health : app.build_health;

      return {
        ...app,
        runtime_health: runtime,
        domain_health_runtime: domain,
        build_health_runtime: buildHealth,
        ...ci,
      };
    })
  );

  return NextResponse.json({
    success: true,
    checked_at: new Date().toISOString(),
    apps: enriched,
  });
}
