import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
                    <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center relative z-10 border-red-500/20">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>

                        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                        <p className="text-slate-400 mb-6">
                            We encountered an unexpected error. The application has been stopped to protect your data.
                        </p>

                        <div className="bg-black/30 p-4 rounded-lg text-left mb-6 overflow-x-auto">
                            <code className="text-xs text-red-300 font-mono">
                                {this.state.error?.toString()}
                            </code>
                        </div>

                        <Button
                            onClick={this.handleReload}
                            className="w-full bg-red-600 hover:bg-red-500 text-white border-0 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reload Application
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
