import { Router } from './framework.router.js';
import { frameworkCore } from './framework.core.js';

describe('Framework Router', () => {
	beforeEach(() => {
		// Clear state and flows before each test
		frameworkCore.clear();
	});

	test('Router initialization registers routerNavigate flow', () => {
		const router = Router();

		// Register router with framework
		router.registerWithFramework(frameworkCore);

		// Check that routerNavigate flow is registered
		const flows = frameworkCore.flows;
		expect(flows.has('routerNavigate')).toBe(true);
	});

	test('Router provides utility methods', () => {
		const router = Router();

		expect(typeof router.getCurrentPath).toBe('function');
		expect(typeof router.getPreviousPath).toBe('function');
	});

	test('routerNavigate flow exists and can be triggered', async () => {
		const router = Router();

		// Register router with framework
		router.registerWithFramework(frameworkCore);

		// Test that the flow exists and can be triggered without errors
		await expect(
			frameworkCore.triggerFlow('routerNavigate', {
				triggeredBy: 'test',
				href: '/test-page',
			})
		).resolves.not.toThrow();
	});

	test('routerNavigate handles missing href gracefully', async () => {
		const originalWarn = console.warn;
		let warnCalled = false;
		console.warn = () => {
			warnCalled = true;
		};

		const router = Router();

		// Register router with framework
		router.registerWithFramework(frameworkCore);

		await frameworkCore.triggerFlow('routerNavigate', {
			triggeredBy: 'test',
		});

		expect(warnCalled).toBe(true);

		console.warn = originalWarn;
	});
});
