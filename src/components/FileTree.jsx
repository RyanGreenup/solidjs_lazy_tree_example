import { createSignal, For } from 'solid-js';
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
  const [expanded, setExpanded] = createSignal(true);
  const isDirectory = () => props.node.type === 'directory';
  
  const toggleExpand = () => {
    if (isDirectory()) {
      setExpanded(!expanded());
    }
  };

  return (
    <div class={styles.node} style={{"padding-left": `${props.depth * 16}px`}}>
      <div class={styles.nodeHeader} onClick={toggleExpand}>
        {isDirectory() && (
          <span class={styles.expandIcon}>
            {expanded() ? '▼' : '►'}
          </span>
        )}
        <span class={`${styles.icon} ${isDirectory() ? styles.folderIcon : styles.fileIcon}`}>
          {isDirectory() ? '📁' : '📄'}
        </span>
        <span class={styles.nodeName}>{props.node.name}</span>
      </div>
      
      {isDirectory() && expanded() && props.node.children && (
        <div class={styles.children}>
          <For each={props.node.children}>
            {(childNode, index) => (
              <FileTreeNode 
                node={childNode} 
                depth={props.depth + 1} 
              />
            )}
          </For>
        </div>
      )}
    </div>
  );
};

// Main FileTree component
const FileTree = (props) => {
  const data = () => props.data || dummyFileTree;
  
  return (
    <div class={styles.fileTree}>
      <h3 class={styles.title}>File Explorer</h3>
      <div class={styles.treeContainer}>
        <FileTreeNode node={data()} depth={0} />
      </div>
    </div>
  );
};

export default FileTree;
