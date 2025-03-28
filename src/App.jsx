import logo from './logo.svg';
import styles from './App.module.css';
import { Modal } from 'flowbite';
import FileTree from './components/FileTree';
import { createSignal, onMount } from 'solid-js';

function App() {
  const [position, setPosition] = createSignal({ x: 20, y: 20 });
  const [size, setSize] = createSignal({ width: 300, height: 400 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [isResizing, setIsResizing] = createSignal(false);
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = createSignal({ x: 0, y: 0 });
  
  // Handle mouse events for dragging
  const handleMouseDown = (e) => {
    if (e.target.classList.contains('explorer-header')) {
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
    <div class={styles.App}>
      <header class={styles.header}>
        <img src={logo} class={styles.logo} alt="logo" />
        <p>
          Edit <code>src/App.jsx</code> and save to reload.
        </p>
        <a
          class="text-4xl text-blue-600"
          href="https://github.com/solidjs/solid"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Solid, Tailwind CSS and Flowbite
        </a>
        
        {/* Draggable and Resizable File Explorer */}
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
          <div class="explorer-header bg-gray-200 p-2 cursor-move flex justify-between items-center">
            <span class="font-bold">File Explorer</span>
          </div>
          <div class="flex-grow overflow-auto">
            <FileTree />
          </div>
          <div 
            class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, #718096 50%)'
            }}
            onMouseDown={handleResizeMouseDown}
          ></div>
        </div>
      </header>
    </div>
  );
}

export default App;

