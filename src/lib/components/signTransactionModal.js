import Modal from './SignTransactionModal.svelte';

/**
 * Creates a Confirmation Dialog and waits for the user to click a button
 * @param {import('$lib/interfaces.js').AddressModalOptions? } options
 * @returns {Promise<boolean>}
 */
export async function sign(options) {
  return new Promise((resolve) => {
    const modal = new Modal({
      target: document.body,
      props: options
    });
    modal.$on('result', (e) => {
      resolve(e.detail);
      modal.$destroy();
    });
  });
}
