import { createSignal, onMount, onCleanup } from 'solid-js';

const ResizablePanel = (props) => {
  const [position, setPosition] = createSignal(props.initialPosition || { x: 20, y: 20 });
  const [size, setSize] = createSignal(props.initialSize || { width: 300, height: 400 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [isResizing, setIsResizing] = createSignal(false);
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = createSignal({ x: 0, y: 0 });
  
  // Handle mouse events for dragging
  const handleMouseDown = (e) => {
    if (e.target.classList.contains('panel-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position().x,
        y: e.clientY - position().y
      });
    }
  };
  
  // Handle mouse events for resizing
  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // Handle mouse move for both dragging and resizing
  const handleMouseMove = (e) => {
    if (isDragging()) {
      setPosition({
        x: e.clientX - dragOffset().x,
        y: e.clientY - dragOffset().y
      });
    } else if (isResizing()) {
      const deltaX = e.clientX - resizeStart().x;
      const deltaY = e.clientY - resizeStart().y;
      
      setSize({
        width: Math.max(200, size().width + deltaX),
        height: Math.max(200, size().height + deltaY)
      });
      
      setResizeStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  };
  
  // Handle mouse up to stop dragging/resizing
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };
  
  // Add global event listeners
  onMount(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });
  
  return (
    <div 
      class="absolute bg-white border border-gray-300 rounded shadow-lg overflow-hidden flex flex-col"
      style={{
        left: `${position().x}px`,
        top: `${position().y}px`,
        width: `${size().width}px`,
        height: `${size().height}px`,
        zIndex: 1000
      }}
      onMouseDown={handleMouseDown}
    >
      <div class="panel-header bg-gray-200 p-2 cursor-move flex justify-between items-center">
        <span class="font-bold">{props.title || 'Panel'}</span>
      </div>
      <div class="flex-grow overflow-auto">
        {props.children}
      </div>
      <div 
        class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, #718096 50%)'
        }}
        onMouseDown={handleResizeMouseDown}
      ></div>
    </div>
  );
};

export default ResizablePanel;
