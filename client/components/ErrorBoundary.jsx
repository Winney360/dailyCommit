import React, { Component } from "react";
import { ErrorFallback } from "@/components/ErrorFallback";

export class ErrorBoundary extends Component {
  state = { error: null };

  static defaultProps = {
    FallbackComponent: ErrorFallback,
  };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (typeof this.props.onError === "function") {
      this.props.onError(error, info.componentStack);
    }
  }

  resetError = () => {
    this.setState({ error: null });
  };

  render() {
    const { FallbackComponent } = this.props;

    return this.state.error && FallbackComponent ? (
      <FallbackComponent
        error={this.state.error}
        resetError={this.resetError}
      />
    ) : (
      this.props.children
    );
  }
}
