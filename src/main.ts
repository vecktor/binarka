import './ui/style.css';
import { mountPlayPage } from './ui/index';

const app = document.querySelector<HTMLElement>('#app');
if (app) mountPlayPage(app);
