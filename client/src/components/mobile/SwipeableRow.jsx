import { useState, useRef } from 'react';

const SwipeableRow = ({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 50,
  className = '',
  disabled = false,
}) => {
  const [offset, setOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState(null); // 'left' | 'right' | null
  const containerRef = useRef(null);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const isDragging = useRef(false);

  const leftActionsWidth = leftActions.length * 70;
  const rightActionsWidth = rightActions.length * 70;

  const handleTouchStart = (e) => {
    if (disabled) return;

    startX.current = e.touches[0].clientX;
    startOffset.current = offset;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current || disabled) return;

    const diff = e.touches[0].clientX - startX.current;
    let newOffset = startOffset.current + diff;

    // Limit drag range
    if (leftActions.length === 0 && newOffset > 0) {
      newOffset = 0;
    }
    if (rightActions.length === 0 && newOffset < 0) {
      newOffset = 0;
    }

    // Add resistance at edges
    if (newOffset > leftActionsWidth) {
      newOffset = leftActionsWidth + (newOffset - leftActionsWidth) * 0.3;
    }
    if (newOffset < -rightActionsWidth) {
      newOffset = -rightActionsWidth + (newOffset + rightActionsWidth) * 0.3;
    }

    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;

    // Determine final position
    if (offset > threshold && leftActions.length > 0) {
      setOffset(leftActionsWidth);
      setIsRevealed('left');
    } else if (offset < -threshold && rightActions.length > 0) {
      setOffset(-rightActionsWidth);
      setIsRevealed('right');
    } else {
      setOffset(0);
      setIsRevealed(null);
    }
  };

  const handleActionClick = (action) => {
    if (action.onClick) {
      action.onClick();
    }
    // Reset after action
    setOffset(0);
    setIsRevealed(null);
  };

  const close = () => {
    setOffset(0);
    setIsRevealed(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 flex"
          style={{ width: leftActionsWidth }}
        >
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={`flex-1 flex flex-col items-center justify-center text-white text-xs font-medium ${action.className || 'bg-blue-500'}`}
              style={{ width: 70 }}
            >
              {action.icon}
              <span className="mt-1">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div
          className="absolute right-0 top-0 bottom-0 flex"
          style={{ width: rightActionsWidth }}
        >
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={`flex-1 flex flex-col items-center justify-center text-white text-xs font-medium ${action.className || 'bg-red-500'}`}
              style={{ width: 70 }}
            >
              {action.icon}
              <span className="mt-1">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className="relative bg-white transition-transform duration-200"
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.2s ease-out',
        }}
        onClick={() => isRevealed && close()}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableRow;
