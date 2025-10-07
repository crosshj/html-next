import { BaseUIComponent } from './BaseUIComponent.js';
import { html } from '../framework.utils.js';
import './XModal.css';

// Define x-modal web component
export class XModal extends BaseUIComponent {
	constructor() {
		super();
		this.isOpen = false;
		this.resolvePromise = null;
		this.overlay = null;
		this.modal = null;
	}

	connectedCallback() {
		// Call parent connectedCallback first to handle sx: styles
		super.connectedCallback();
		this.render();
	}

	disconnectedCallback() {
		// Clean up event listeners
		if (this.overlay) {
			this.overlay.removeEventListener('click', this.handleOverlayClick);
		}
		if (this.modal) {
			this.modal.removeEventListener('keydown', this.handleKeydown);
		}
		super.disconnectedCallback();
	}

	render() {
		const title = this.getAttribute('title') || '';
		const message = this.getAttribute('message') || '';
		const type = this.getAttribute('type') || 'alert'; // 'alert' or 'confirm'
		const confirmText = this.getAttribute('confirmText') || 'OK';
		const cancelText = this.getAttribute('cancelText') || 'Cancel';

		this.innerHTML = html`
			<div class="modal-overlay" style="display: none;">
				<div class="modal-container">
					<div class="modal-content">
						${title
							? html`<div class="modal-header">
									<h3 class="modal-title">${title}</h3>
							  </div>`
							: ''}
						<div class="modal-body">
							<p class="modal-message">${message}</p>
						</div>
						<div class="modal-footer">
							${type === 'confirm'
								? html`
										<button
											class="modal-button modal-button-cancel"
											type="button"
										>
											${cancelText}
										</button>
								  `
								: ''}
							<button class="modal-button modal-button-confirm" type="button">
								${confirmText}
							</button>
						</div>
					</div>
				</div>
			</div>
		`;

		// Store references for event handling
		this.overlay = this.querySelector('.modal-overlay');
		this.modal = this.querySelector('.modal-container');

		// Add event listeners
		this.setupEventListeners();
	}

	setupEventListeners() {
		if (!this.overlay || !this.modal) return;

		// Remove existing listeners to prevent duplicates
		if (this.handleOverlayClick) {
			this.overlay.removeEventListener('click', this.handleOverlayClick);
		}
		if (this.handleKeydown) {
			document.body.removeEventListener('keydown', this.handleKeydown);
		}

		// Overlay click to close (only for alert modals, not confirm)
		this.handleOverlayClick = (e) => {
			if (e.target === this.overlay) {
				const type = this.getAttribute('type');
				// Only allow overlay click to close for alert modals
				if (type === 'alert') {
					this.close(false);
				}
			}
		};
		this.overlay.addEventListener('click', this.handleOverlayClick);

		// Keyboard handling (only for alert modals, not confirm)
		this.handleKeydown = (e) => {
			if (e.key === 'Escape') {
				const type = this.getAttribute('type');
				// Only allow Escape to close for alert modals
				if (type === 'alert') {
					this.close(false);
				}
			}
		};
		// Add listener to document body for better capture
		document.body.addEventListener('keydown', this.handleKeydown);

		// Button clicks - remove existing listeners first
		const confirmButton = this.querySelector('.modal-button-confirm');
		const cancelButton = this.querySelector('.modal-button-cancel');

		// Clone buttons to remove all event listeners
		if (confirmButton) {
			const newConfirmButton = confirmButton.cloneNode(true);
			confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
			newConfirmButton.addEventListener('click', () => this.close(true));
		}

		if (cancelButton) {
			const newCancelButton = cancelButton.cloneNode(true);
			cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
			newCancelButton.addEventListener('click', () => this.close(false));
		}
	}

	show() {
		this.isOpen = true;
		this.overlay.style.display = 'flex';
		// Make sure modal content is visible
		if (this.modal) {
			this.modal.style.display = 'flex';
		}
		document.body.style.overflow = 'hidden'; // Prevent background scrolling

		// Focus the modal for keyboard navigation
		this.modal.focus();
		this.modal.setAttribute('tabindex', '-1');
	}

	hide() {
		this.isOpen = false;
		this.overlay.style.display = 'none';
		document.body.style.overflow = ''; // Restore scrolling
	}

	close(result) {
		// Clean up event listeners when closing
		if (this.handleKeydown) {
			document.body.removeEventListener('keydown', this.handleKeydown);
		}
		if (this.handleOverlayClick) {
			this.overlay.removeEventListener('click', this.handleOverlayClick);
		}

		// Just resolve the promise - let the caller decide what to do
		if (this.resolvePromise) {
			this.resolvePromise(result);
			this.resolvePromise = null;
		}
	}

	// Method to hide the modal content but keep overlay
	hideContent() {
		this.isOpen = false;
		// Hide the modal content but keep the overlay visible
		if (this.modal) {
			this.modal.style.display = 'none';
		}
		// Don't restore scrolling since overlay is still visible
	}

	// Method to fully hide and remove the modal
	dispose() {
		this.hide();
		setTimeout(() => {
			if (this.parentNode) {
				this.parentNode.removeChild(this);
			}
		}, 100);
	}

	// Method to update modal content and show again
	updateAndShow(message, title, type = 'alert', resolvePromise) {
		this.setAttribute('message', message);
		this.setAttribute('title', title);
		this.setAttribute('type', type);
		this.resolvePromise = resolvePromise;

		// Update content without full re-render to avoid flash
		this.updateContent(message, title, type);

		// Show the updated modal
		requestAnimationFrame(() => {
			this.show();
		});
	}

	// Update modal content without full re-render
	updateContent(message, title, type) {
		// Update title
		const titleElement = this.querySelector('#modal-title');
		if (titleElement) {
			titleElement.textContent = title;
		}

		// Update message
		const messageElement = this.querySelector('.modal-body p');
		if (messageElement) {
			messageElement.textContent = message;
		}

		// Update button visibility for confirm vs alert
		const cancelButton = this.querySelector('.modal-button-cancel');
		const isConfirm = type === 'confirm';

		if (cancelButton) {
			cancelButton.style.display = isConfirm ? 'block' : 'none';
		}

		// Update button event listeners
		this.setupEventListeners();
	}

	// Static method to find existing modal
	static findExistingModal() {
		return document.querySelector('x-modal');
	}

	// Static method to show alert
	static async alert(message, title = 'Alert') {
		// Create new modal (framework functions check for existing modals first)
		return new Promise((resolve) => {
			const modal = document.createElement('x-modal');
			modal.setAttribute('type', 'alert');
			modal.setAttribute('message', message);
			modal.setAttribute('title', title);

			modal.resolvePromise = resolve;
			document.body.appendChild(modal);

			// Wait for the component to be connected and rendered
			const showModal = () => {
				if (modal.overlay) {
					modal.show();
				} else {
					// Component not ready yet, try again
					requestAnimationFrame(showModal);
				}
			};
			requestAnimationFrame(showModal);
		});
	}

	// Static method to show confirm dialog
	static async confirm(message, title = 'Confirm') {
		// Create new modal (framework functions check for existing modals first)
		return new Promise((resolve) => {
			const modal = document.createElement('x-modal');
			modal.setAttribute('type', 'confirm');
			modal.setAttribute('message', message);
			modal.setAttribute('title', title);

			modal.resolvePromise = resolve;
			document.body.appendChild(modal);

			// Wait for the component to be connected and rendered
			const showModal = () => {
				if (modal.overlay) {
					modal.show();
				} else {
					// Component not ready yet, try again
					requestAnimationFrame(showModal);
				}
			};
			requestAnimationFrame(showModal);
		});
	}
}
