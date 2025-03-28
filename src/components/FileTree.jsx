import { createSignal, For, Show, onMount, createEffect } from 'solid-js';
import styles from './FileTree.module.css';
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  createDraggable,
  createDroppable,
  useDragDropContext
} from "@thisbeyond/solid-dnd";

// Sample file tree data structure
const dummyFileTree = {
  name: 'project-root',
  type: 'directory',
  children: [
    {
      name: 'src',
      type: 'directory',
      children: [
        {
          name: 'components',
          type: 'directory',
          children: [
            { name: 'FileTree.jsx', type: 'file' },
            { name: 'FileTree.module.css', type: 'file' }
          ]
        },
        { name: 'App.jsx', type: 'file' },
        { name: 'index.jsx', type: 'file' },
        { name: 'logo.svg', type: 'file' }
      ]
    },
    {
      name: 'public',
      type: 'directory',
      children: [
        { name: 'index.html', type: 'file' },
        { name: 'favicon.ico', type: 'file' }
      ]
    },
    { name: 'package.json', type: 'file' },
    { name: 'README.md', type: 'file' }
  ]
};

// File or Directory component
const FileTreeNode = (props) => {
  const isDirectory = () => props.node.type === 'directory';
  const nodePath = () => props.parentPath 
    ? `${props.parentPath}/${props.node.name}` 
    : props.node.name;
  
  const isExpanded = () => {
    return props.expandedNodes && props.expandedNodes[nodePath()];
  };
  
  const isSelected = () => {
    return props.selectedPath === nodePath();
  };
  
  const toggleExpand = (e) => {
    e.stopPropagation();
    if (isDirectory()) {
      props.onToggleExpand(nodePath());
    }
  };

  // Create draggable and droppable directives
  const draggable = createDraggable(nodePath());
  const droppable = isDirectory() ? createDroppable(nodePath()) : null;

  // Get drag drop context for styling
  const [dragDropState] = useDragDropContext();
  
  // Determine if this node is being dragged over
  const isOver = () => {
    return isDirectory() && 
           dragDropState.active?.droppable === nodePath();
  };

  // Determine if this node is currently being dragged
  const isDragging = () => {
    return dragDropState.active?.draggable === nodePath();
  };

  return (
    <div 
      class={styles.node} 
      style={{"padding-left": `${props.depth * 16}px`}}
      classList={{
        [styles.isDragging]: isDragging(),
        [styles.isOver]: isOver()
      }}
    >
      <div 
        class={`${styles.nodeHeader} ${isSelected() ? styles.selected : ''}`} 
        onClick={(e) => {
          // Handle click for selection
          props.onSelect?.(nodePath());
        }}
        data-path={nodePath()}
        use:draggable
        use:droppable
      >
        {isDirectory() && (
          <span 
            class={styles.expandIcon} 
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(e);
            }}
          >
            {isExpanded() ? '▼' : '►'}
          </span>
        )}
        <span class={`${styles.icon} ${isDirectory() ? styles.folderIcon : styles.fileIcon}`}>
          {isDirectory() ? '📁' : '📄'}
        </span>
        <span class={styles.nodeName}>{props.node.name}</span>
      </div>
      
      <Show when={isDirectory() && isExpanded() && props.node.children}>
        <div class={styles.children}>
          <For each={props.node.children}>
            {(childNode) => (
              <FileTreeNode 
                node={childNode} 
                depth={props.depth + 1}
                parentPath={nodePath()}
                selectedPath={props.selectedPath}
                expandedNodes={props.expandedNodes}
                onToggleExpand={props.onToggleExpand}
                onSelect={props.onSelect}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

// Flatten tree for keyboard navigation
const flattenTree = (node, result = [], level = 0, parentPath = '') => {
  const path = parentPath ? `${parentPath}/${node.name}` : node.name;
  result.push({ ...node, level, path });
  
  if (node.type === 'directory' && node.children) {
    node.children.forEach(child => {
      flattenTree(child, result, level + 1, path);
    });
  }
  
  return result;
};

// Main FileTree component
const FileTree = (props) => {
  const [fileTree, setFileTree] = createSignal(props.data || dummyFileTree);
  const [flatNodes, setFlatNodes] = createSignal([]);
  const [selectedNodePath, setSelectedNodePath] = createSignal('');
  const [expandedNodes, setExpandedNodes] = createSignal({});
  const [draggedNode, setDraggedNode] = createSignal(null);
  
  // Initialize flat node list
  createEffect(() => {
    setFlatNodes(flattenTree(fileTree()));
    
    // Initialize all directories as expanded only on first render
    if (Object.keys(expandedNodes()).length === 0) {
      const expanded = {};
      flatNodes().forEach(node => {
        if (node.type === 'directory') {
          expanded[node.path] = true;
        }
      });
      setExpandedNodes(expanded);
    }
    
    // Select the first node by default
    if (flatNodes().length > 0 && !selectedNodePath()) {
      setSelectedNodePath(flatNodes()[0].path);
    }
  });
  
  // Get visible nodes (nodes that are in expanded directories)
  const getVisibleNodes = () => {
    const visible = [];
    const expanded = expandedNodes();
    
    const isNodeVisible = (node, parentPath = '') => {
      // Root is always visible
      if (!parentPath) return true;
      
      // Check if all parent directories are expanded
      const pathParts = parentPath.split('/');
      let currentPath = '';
      
      for (let i = 0; i < pathParts.length; i++) {
        if (i > 0) currentPath += '/';
        currentPath += pathParts[i];
        if (!expanded[currentPath]) return false;
      }
      
      return true;
    };
    
    flatNodes().forEach(node => {
      if (isNodeVisible(node, node.path.substring(0, node.path.lastIndexOf('/')))) {
        visible.push(node);
      }
    });
    
    return visible;
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'j' || e.key === 'k') {
      e.preventDefault();
      
      const visibleNodes = getVisibleNodes();
      const currentIndex = visibleNodes.findIndex(node => node.path === selectedNodePath());
      
      if (currentIndex === -1) return;
      
      let newIndex;
      if (e.key === 'j') { // Down
        newIndex = Math.min(currentIndex + 1, visibleNodes.length - 1);
      } else { // Up (k)
        newIndex = Math.max(currentIndex - 1, 0);
      }
      
      // Update selection without modifying expanded state
      const newPath = visibleNodes[newIndex].path;
      setSelectedNodePath(newPath);
      
      // Ensure the selected node is visible
      const element = document.querySelector(`[data-path="${newPath}"]`);
      if (element) {
        element.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === ' ' || e.key === 'Spacebar') { // Handle space key
      e.preventDefault();
      
      const selectedNode = flatNodes().find(node => node.path === selectedNodePath());
      if (selectedNode && selectedNode.type === 'directory') {
        toggleExpand(selectedNodePath());
      }
    }
  };
  
  // Toggle expanded state for a directory
  const toggleExpand = (path) => {
    setExpandedNodes(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };
  
  // Handle node selection
  const handleSelect = (path) => {
    setSelectedNodePath(path);
  };
  
  // Find a node by path
  const findNodeByPath = (path, tree = fileTree(), parentPath = '') => {
    const currentPath = parentPath ? `${parentPath}/${tree.name}` : tree.name;
    
    if (currentPath === path) {
      return { node: tree, parent: null };
    }
    
    if (tree.type === 'directory' && tree.children) {
      for (let i = 0; i < tree.children.length; i++) {
        const result = findNodeByPath(path, tree.children[i], currentPath);
        if (result.node) {
          if (!result.parent) {
            result.parent = tree;
          }
          return result;
        }
      }
    }
    
    return { node: null, parent: null };
  };
  
  // Handle drag and drop operations
  const handleDragDrop = ({ draggable, droppable }) => {
    if (!draggable || !droppable) return;
    
    const sourcePath = draggable.id;
    const targetPath = droppable.id;
    
    // Don't drop onto self
    if (sourcePath === targetPath) return;
    
    // Don't drop a parent into its child
    if (targetPath.startsWith(sourcePath + '/')) return;
    
    // Find the source node and its parent
    const sourceParentPath = sourcePath.substring(0, sourcePath.lastIndexOf('/'));
    const { node: sourceNode } = findNodeByPath(sourcePath);
    
    if (!sourceNode) return;
    
    // Find the target node
    const { node: targetNode } = findNodeByPath(targetPath);
    if (!targetNode || targetNode.type !== 'directory') return;
    
    // Create a deep copy of the file tree
    const newTree = JSON.parse(JSON.stringify(fileTree()));
    
    // Remove the source node from its parent
    const { node: newSourceParent } = findNodeByPath(sourceParentPath, newTree);
    
    if (newSourceParent && newSourceParent.children) {
      const sourceIndex = newSourceParent.children.findIndex(
        child => `${sourceParentPath}/${child.name}` === sourcePath
      );
      
      if (sourceIndex !== -1) {
        const [removedNode] = newSourceParent.children.splice(sourceIndex, 1);
        
        // Add the source node to the target node
        const { node: newTargetNode } = findNodeByPath(targetPath, newTree);
        
        if (newTargetNode && newTargetNode.children) {
          newTargetNode.children.push(removedNode);
          
          // Ensure the target directory is expanded
          setExpandedNodes(prev => ({
            ...prev,
            [targetPath]: true
          }));
          
          // Update the file tree
          setFileTree(newTree);
        }
      }
    }
  };
  
  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
  
  // Get the selected node's name for display
  const getSelectedNodeName = () => {
    const selectedNode = flatNodes().find(node => node.path === selectedNodePath());
    return selectedNode ? selectedNode.path : 'No selection';
  };

  // Get the node for the drag overlay
  const getDraggedNodeDisplay = () => {
    if (!draggedNode()) return null;
    
    const node = flatNodes().find(n => n.path === draggedNode());
    if (!node) return null;
    
    return (
      <div class={styles.dragOverlay}>
        <span class={`${styles.icon} ${node.type === 'directory' ? styles.folderIcon : styles.fileIcon}`}>
          {node.type === 'directory' ? '📁' : '📄'}
        </span>
        <span class={styles.nodeName}>{node.name}</span>
      </div>
    );
  };

  // Handle drag start
  const handleDragStart = ({ draggable }) => {
    setDraggedNode(draggable.id);
  };

  return (
    <div class={styles.fileTree} tabIndex="0">
      <h3 class={styles.title}>File Explorer</h3>
      <div class={styles.selectedItemDisplay}>
        <span class={styles.selectedItemLabel}>Selected: </span>
        {getSelectedNodeName()}
      </div>
      <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragDrop}>
        <DragDropSensors />
        <div class={styles.treeContainer}>
          <FileTreeNode 
            node={fileTree()} 
            depth={0} 
            selectedPath={selectedNodePath()}
            expandedNodes={expandedNodes()}
            onToggleExpand={toggleExpand}
            onSelect={handleSelect}
          />
        </div>
        <DragOverlay>
          {getDraggedNodeDisplay()}
        </DragOverlay>
      </DragDropProvider>
    </div>
  );
};

export default FileTree;
