import type { Metadata } from 'next';
import Link from 'next/link';
import BenchDownload from '../../components/BenchDownload';

export const metadata: Metadata = {
  title: 'streamsuite-bench · measure your real RPC latency · StreamSuite',
  description:
    'Free CLI tool. Measure your real RTT to our Ashburn BSC node from your bot. Two numbers — network and server-side — so you know what we can SLA and what we can’t.',
};

const SAMPLE_OUT_PASS = `$ streamsuite-bench

  detected location:  us-east-1 (Reston, VA)
  1000 \xD7 eth_blockNumber  →  va-bsc-01.streamsuite.io

  Network RTT (TCP-SYN → :443):           1.12 ms
  Server processing (RPC − network):       0.58 ms
  ----------------------------------------------
  Total RPC RTT (p99):                     1.70 ms

  Server SLA target (p99 ≤ 5 ms): PASS (0.58 ms)`;

const SAMPLE_OUT_COMPARE = `$ streamsuite-bench --vs https://your-current-rpc.example/<YOUR_API_KEY>

  endpoint                       p50      p99      max
  streamsuite (ashburn)         0.8 ms   1.7 ms   3.2 ms
  your-current-rpc.example     11.3 ms  42.1 ms  89.0 ms

  Verdict: streamsuite is 14\xD7 faster (p50), 17\xD7 faster (p99).`;

const SAMPLE_OUT_APAC = `$ streamsuite-bench

  detected location:  ap-southeast-1 (Singapore)
  1000 \xD7 eth_blockNumber  →  va-bsc-01.streamsuite.io

  Network RTT (TCP-SYN → :443):         218.3 ms
  Server processing (RPC − network):     0.61 ms
  ----------------------------------------------
  Total RPC RTT (p99):                   218.9 ms

  Server SLA target (p99 ≤ 5 ms): PASS (0.61 ms)
  Note: total latency dominated by network distance.
  Colocate within US-east for sub-5 ms total.`;

function CodeBlock({ children, mono = true }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <pre
      className={`card overflow-x-auto p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-ink whitespace-pre ${
        mono ? 'font-mono' : ''
      }`}
    >
      <code>{children}</code>
    </pre>
  );
}

export default function BenchPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 pt-16 pb-24 md:pt-20">
      {/* HERO */}
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/80 mb-3">
        ┌── run-from-your-bot ──┐
      </p>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink mb-5 leading-[1.1]">
        Stop trusting marketing numbers.
        <br className="hidden sm:block" />
        <span className="accent-gradient">Measure us from your bot.</span>
      </h1>
      <p className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
        Free CLI tool. Runs where your bot lives. Reports two numbers separately:
        what your network looks like, and what our server actually does. No signup,
        no telemetry, no data collection beyond the output you choose to share.
      </p>

      {/* INSTALL */}
      <div className="mt-8 space-y-3">
        <p className="text-xs font-mono uppercase tracking-wider text-muted">
          install (linux + macOS, amd64 + arm64)
        </p>
        <CodeBlock>{`curl -sSL https://streamsuite.io/bench/install.sh | sh`}</CodeBlock>
        <p className="text-xs text-muted">
          ~5 MB static Go binary. No dependencies.{' '}
          <a
            href="https://github.com/StreamSuite-RPC/bench"
            className="text-accent hover:text-accent-bright underline underline-offset-2"
          >
            Source on GitHub
          </a>
          {' '} · {' '}
          <a
            href="https://github.com/StreamSuite-RPC/bench/releases"
            className="text-accent hover:text-accent-bright underline underline-offset-2"
          >
            All releases
          </a>
        </p>
        <div className="mt-5">
          <BenchDownload version="1.0.1" />
        </div>
      </div>

      {/* TWO NUMBERS */}
      <section className="mt-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/80 mb-3">
          why two numbers
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-5">
          Network and server are not the same thing.
        </h2>
        <p className="text-base text-muted leading-relaxed max-w-2xl">
          Most RPC vendors quote one mushy latency number that mixes their server
          speed with your network distance. That number is marketing, not
          engineering. The bench tool reports them <em>separately</em>:
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div className="card p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-accent mb-2">
              server processing
            </p>
            <p className="text-base text-ink leading-relaxed">
              How fast our Ashburn node answers your RPC call once it arrives.{' '}
              <strong className="text-ink">This is what we SLA.</strong>
            </p>
          </div>
          <div className="card p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-2">
              network RTT
            </p>
            <p className="text-base text-muted leading-relaxed">
              The physical distance between your machine and our Ashburn box.
              Physics. Not something we (or anyone) can SLA away.
            </p>
          </div>
        </div>
        <p className="mt-6 text-sm text-muted leading-relaxed max-w-2xl">
          If you run your bot in us-east-1, both numbers are small. If you run
          it in Singapore, network is big and you’ll know to colocate or pick
          a different vendor. We’d rather you self-disqualify than discover it
          after you paid.
        </p>
      </section>

      {/* SAMPLE OUTPUT */}
      <section className="mt-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/80 mb-3">
          sample output
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-5">
          What you’ll see.
        </h2>

        <p className="text-sm text-muted mb-3 font-mono">us-east bot → PASS</p>
        <CodeBlock>{SAMPLE_OUT_PASS}</CodeBlock>

        <p className="text-sm text-muted mb-3 mt-6 font-mono">vs. your current RPC</p>
        <CodeBlock>{SAMPLE_OUT_COMPARE}</CodeBlock>

        <p className="text-sm text-muted mb-3 mt-6 font-mono">APAC bot → server still passes, but network dominates</p>
        <CodeBlock>{SAMPLE_OUT_APAC}</CodeBlock>
      </section>

      {/* WHAT IT MEASURES */}
      <section className="mt-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/80 mb-3">
          methodology
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-5">
          What we measure. What we don’t.
        </h2>
        <ul className="space-y-3 text-sm sm:text-base text-muted leading-relaxed">
          <li>
            <span className="text-ink font-medium">Measured:</span> RTT for{' '}
            <code className="font-mono text-accent">eth_blockNumber</code> over
            HTTPS, plus TCP-SYN handshake to{' '}
            <code className="font-mono text-accent">va-bsc-01.streamsuite.io:443</code>.
            Results stay on your machine.
          </li>
          <li>
            <span className="text-ink font-medium">Not measured:</span> DNS lookup time
            (resolved once, cached), browser/proxy overhead, your bot’s internal
            processing. The tool times TCP-SYN → JSON-RPC response on the same
            keep-alive TCP connection.
          </li>
          <li>
            <span className="text-ink font-medium">SLA boundary:</span> our SLA covers the{' '}
            <em>server processing</em> number only — second line in the output. Network
            RTT is not a refund condition. See{' '}
            <Link href="/legal/refunds" className="text-accent hover:text-accent-bright underline underline-offset-2">
              refund policy
            </Link>
            .
          </li>
          <li>
            <span className="text-ink font-medium">Rate limit:</span> the public benchmark
            API key embedded in the binary is capped at 1,000 requests per IP per day,
            read-only methods only.
          </li>
        </ul>
      </section>

      {/* CTA */}
      <section className="mt-14 card p-6 sm:p-8 border-accent/30 bg-accent/[0.03]">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink mb-2">
          See the numbers? Skip the trial.
        </h2>
        <p className="text-sm sm:text-base text-muted leading-relaxed mb-5 max-w-xl">
          We don’t run a free tier. We don’t do free trials. The bench tool
          is how you decide. If we look right for your bot, start a plan; if not,
          you saved both of us a dispute.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/pricing" className="btn-primary text-sm">
            See pricing
          </Link>
          <Link href="/benchmarks" className="btn-secondary text-sm">
            Our internal stress test
          </Link>
        </div>
      </section>

      {/* FAQ-LITE */}
      <section className="mt-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/80 mb-3">
          quick answers
        </p>
        <div className="space-y-5 text-sm sm:text-base">
          <div>
            <p className="text-ink font-medium mb-1">Is the binary safe?</p>
            <p className="text-muted leading-relaxed">
              Static Go binary, MIT-licensed source on GitHub, no network calls
              outside the benchmark target and a single GitHub release lookup.
              Easy to audit, easy to sandbox.
            </p>
          </div>
          <div>
            <p className="text-ink font-medium mb-1">Does it send data back to you?</p>
            <p className="text-muted leading-relaxed">
              Only the RPC calls themselves — same as if you curl’d the endpoint
              yourself. We do not collect, store, or share your output.
            </p>
          </div>
          <div>
            <p className="text-ink font-medium mb-1">Does it work for Ethereum / Base / Arbitrum?</p>
            <p className="text-muted leading-relaxed">
              Not yet. BSC only at launch. Other chains follow the same model —
              request access at{' '}
              <Link href="/pricing" className="text-accent hover:text-accent-bright underline underline-offset-2">
                /pricing
              </Link>
              .
            </p>
          </div>
          <div>
            <p className="text-ink font-medium mb-1">Browser version?</p>
            <p className="text-muted leading-relaxed">
              We have one at{' '}
              <Link href="/" className="text-accent hover:text-accent-bright underline underline-offset-2">
                home
              </Link>{' '}
              for a quick first impression, but JS fetch adds 1–3 ms of overhead and
              can’t isolate server vs network. The CLI is the honest version.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
