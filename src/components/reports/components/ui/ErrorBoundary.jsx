import { Component } from 'react';
import PropTypes from 'prop-types';
import { RotateCcw } from 'lucide-react';
import { Button } from './Button';

/**
 * Catches render-time crashes so a bug in one panel does not blank the whole
 * PMO app. Data-fetching failures are handled by `ErrorState` instead — this
 * is the last line of defence, not the normal path.
 *
 * Still a class component: React has no hook equivalent of
 * `componentDidCatch`.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.props.onError?.(error, info);
    if (import.meta.env?.DEV) {
      console.error('[reports] Unhandled render error', error, info);
    }
  }

  /** Remounts the subtree; `resetKey` changes also clear the error (see below). */
  reset = () => this.setState({ error: null });

  componentDidUpdate(prevProps) {
    // Navigating to a different report should clear a stale crash.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.reset();
    }
  }

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (!error) return children;
    if (fallback) return fallback({ error, reset: this.reset });

    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-14 text-center"
      >
        <h3 className="text-sm font-semibold text-slate-900">This section stopped working</h3>
        <p className="mt-1.5 max-w-sm text-sm text-slate-500">
          The rest of the page is unaffected. Reloading this section usually fixes it.
        </p>
        <Button variant="secondary" leadingIcon={RotateCcw} onClick={this.reset} className="mt-5">
          Reload section
        </Button>
      </div>
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  /** Render prop for a custom fallback: ({ error, reset }) => ReactNode */
  fallback: PropTypes.func,
  /** Change this (e.g. to the route id) to clear the error automatically. */
  resetKey: PropTypes.any,
  onError: PropTypes.func,
};
