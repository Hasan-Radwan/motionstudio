// Minimal modal helper. openModal({ title, body }) returns { close, root }.
const host = () => document.getElementById('modal-root');

export function openModal({ title, render }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal-header';
  const h = document.createElement('h2');
  h.textContent = title;
  const close = document.createElement('button');
  close.className = 'modal-close';
  close.innerHTML = '&times;';
  header.append(h, close);

  const body = document.createElement('div');
  body.className = 'modal-body';

  modal.append(header, body);
  backdrop.appendChild(modal);
  host().appendChild(backdrop);

  const destroy = () => backdrop.remove();
  close.addEventListener('click', destroy);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) destroy();
  });

  if (render) render(body, destroy);
  return { close: destroy, body };
}
