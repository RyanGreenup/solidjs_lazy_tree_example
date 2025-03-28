import logo from './logo.svg';
import styles from './App.module.css';
import { Modal } from 'flowbite';
import FileTree from './components/FileTree';

function App() {
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
        <FileTree />
      </header>
    </div>
  );
}

export default App;

