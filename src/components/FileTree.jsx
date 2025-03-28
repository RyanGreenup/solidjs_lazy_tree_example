import { createSignal, For, Show, onMount, createEffect } from 'solid-js';
import styles from './FileTree.module.css';

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

  return (
    <div class={styles.node} style={{"padding-left": `${props.depth * 16}px`}}>
      <div 
        class={`${styles.nodeHeader} ${isSelected() ? styles.selected : ''}`} 
        onClick={toggleExpand}
        data-path={nodePath()}
      >
        {isDirectory() && (
          <span class={styles.expandIcon}>
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
  const data = () => props.data || dummyFileTree;
  const [flatNodes, setFlatNodes] = createSignal([]);
  const [selectedNodePath, setSelectedNodePath] = createSignal('');
  const [expandedNodes, setExpandedNodes] = createSignal({});
  
  // Initialize flat node list
  createEffect(() => {
    setFlatNodes(flattenTree(data()));
    
    // Initialize all directories as expanded
    const expanded = {};
    flatNodes().forEach(node => {
      if (node.type === 'directory') {
        expanded[node.path] = true;
      }
    });
    setExpandedNodes(expanded);
    
    // Select the first node by default
    if (flatNodes().length > 0 && !selectedNodePath()) {
      setSelectedNodePath(flatNodes()[0].path);
    }
  });
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'j' || e.key === 'k') {
      e.preventDefault();
      
      const nodes = flatNodes();
      const currentIndex = nodes.findIndex(node => node.path === selectedNodePath());
      
      if (currentIndex === -1) return;
      
      let newIndex;
      if (e.key === 'j') { // Down
        newIndex = Math.min(currentIndex + 1, nodes.length - 1);
      } else { // Up (k)
        newIndex = Math.max(currentIndex - 1, 0);
      }
      
      setSelectedNodePath(nodes[newIndex].path);
      
      // Ensure the selected node is visible
      const element = document.querySelector(`[data-path="${nodes[newIndex].path}"]`);
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
  
  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
  
  // Get the selected node's name for display
  const getSelectedNodeName = () => {
    const selectedNode = flatNodes().find(node => node.path === selectedNodePath());
    return selectedNode ? selectedNode.path : 'No selection';
  };

  return (
    <div class={styles.fileTree} tabIndex="0">
      <h3 class={styles.title}>File Explorer</h3>
      <div class={styles.selectedItemDisplay}>
        <span class={styles.selectedItemLabel}>Selected: </span>
        {getSelectedNodeName()}
      </div>
      <div class={styles.treeContainer}>
        <FileTreeNode 
          node={data()} 
          depth={0} 
          selectedPath={selectedNodePath()}
          expandedNodes={expandedNodes()}
          onToggleExpand={toggleExpand}
        />
      </div>
    </div>
  );
};

export default FileTree;
