import { render, screen, waitFor } from "@testing-library/react";
import ErrorNotification from "@/components/ErrorNotification";

describe("ErrorNotification", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should not render when error is null", () => {
    const { container } = render(<ErrorNotification error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render generic error message", () => {
    render(<ErrorNotification error="Something went wrong" />);
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });

  it("should render RATE_LIMIT error with special styling", () => {
    render(<ErrorNotification error="RATE_LIMIT" />);
    expect(screen.getByText("Servicio temporalmente no disponible")).toBeInTheDocument();
    expect(screen.getByText(/Los servicios de IA están temporalmente saturados/i)).toBeInTheDocument();
    expect(screen.getByText("⏳")).toBeInTheDocument();
  });

  it("should call onDismiss when dismiss button is clicked", () => {
    const onDismiss = jest.fn();
    render(<ErrorNotification error="Test error" onDismiss={onDismiss} />);
    
    const dismissButton = screen.getByLabelText("Cerrar");
    dismissButton.click();
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should call onRetry when retry button is clicked", () => {
    const onRetry = jest.fn();
    render(<ErrorNotification error="Test error" onRetry={onRetry} />);
    
    const retryButton = screen.getByText("Reintentar");
    retryButton.click();
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should not show retry button when onRetry is not provided", () => {
    render(<ErrorNotification error="Test error" />);
    expect(screen.queryByText("Reintentar")).not.toBeInTheDocument();
  });

  it("should not show dismiss button when onDismiss is not provided", () => {
    render(<ErrorNotification error="Test error" />);
    expect(screen.queryByLabelText("Cerrar")).not.toBeInTheDocument();
  });

  it("should auto-hide after delay when autoHide is true", async () => {
    const onDismiss = jest.fn();
    render(
      <ErrorNotification
        error="Test error"
        onDismiss={onDismiss}
        autoHide={true}
        autoHideDelay={1000}
      />
    );

    expect(onDismiss).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  it("should not auto-hide when autoHide is false", async () => {
    const onDismiss = jest.fn();
    render(
      <ErrorNotification
        error="RATE_LIMIT"
        onDismiss={onDismiss}
        autoHide={false}
      />
    );

    jest.advanceTimersByTime(10000);
    
    await waitFor(() => {
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  it("should use custom autoHideDelay", async () => {
    const onDismiss = jest.fn();
    render(
      <ErrorNotification
        error="Test error"
        onDismiss={onDismiss}
        autoHide={true}
        autoHideDelay={2000}
      />
    );

    jest.advanceTimersByTime(1000);
    expect(onDismiss).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
