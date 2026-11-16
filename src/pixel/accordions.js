/* <details name="x"> groups open one at a time in current browsers without any script. This closes the others by hand
   for the browsers that do not know the name attribute yet. */

export function initAccordions() {
  document.querySelectorAll('details[name]').forEach(d => {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      document.querySelectorAll('details[name="' + d.getAttribute('name') + '"]').forEach(o => { if (o !== d) o.open = false; });
    });
  });
}
