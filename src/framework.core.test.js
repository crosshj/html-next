import { frameworkCore } from './framework.core.js';

describe('Framework Core - Flow Triggering', () => {
	beforeEach(() => {
		// Clear state and flows before each test
		frameworkCore.clear();
	});

	test('Trigger() function is available in flow context', async () => {
		// Register a flow that will be triggered
		frameworkCore.registerFlow(
			{ key: 'targetFlow' },
			'SetData("triggeredFlowExecuted", true); SetData("triggerData", event.data);'
		);

		// Register a flow that triggers another flow
		frameworkCore.registerFlow(
			{ key: 'triggerFlow' },
			'Trigger("targetFlow", { message: "hello", count: 42 });'
		);

		// Execute the trigger flow
		await frameworkCore.triggerFlow('triggerFlow', { triggeredBy: 'test' });

		expect(frameworkCore.get('triggeredFlowExecuted')).toBe(true);
		expect(frameworkCore.get('triggerData')).toEqual({
			message: 'hello',
			count: 42,
		});
	});

	test('Trigger() passes correct event metadata', async () => {
		frameworkCore.registerFlow(
			{ key: 'targetFlow' },
			'SetData("eventData", { triggeredBy: event.triggeredBy, flowStack: event.flowStack, data: event.data });'
		);

		frameworkCore.registerFlow(
			{ key: 'triggerFlow' },
			'Trigger("targetFlow", { test: "data" });'
		);

		await frameworkCore.triggerFlow(
			'triggerFlow',
			{ triggeredBy: 'test' },
			'triggerFlow'
		);

		const eventData = frameworkCore.get('eventData');
		expect(eventData.triggeredBy).toBe('flow');
		expect(eventData.flowStack).toEqual(['triggerFlow']);
		expect(eventData.data).toEqual({ test: 'data' });
	});

	test('Trigger() tracks flow call chain correctly', async () => {
		frameworkCore.registerFlow(
			{ key: 'flowA' },
			'Trigger("flowB", { step: 1 });'
		);

		frameworkCore.registerFlow(
			{ key: 'flowB' },
			'SetData("flowBEvent", { flowStack: event.flowStack }); Trigger("flowC", { step: 2 });'
		);

		frameworkCore.registerFlow(
			{ key: 'flowC' },
			'SetData("flowCEvent", { flowStack: event.flowStack });'
		);

		await frameworkCore.triggerFlow('flowA', { triggeredBy: 'test' }, 'flowA');

		const flowBEvent = frameworkCore.get('flowBEvent');
		const flowCEvent = frameworkCore.get('flowCEvent');
		expect(flowBEvent.flowStack).toEqual(['flowA']);
		expect(flowCEvent.flowStack).toEqual(['flowA', 'flowB']);
	});

	test('Trigger() handles empty data parameter', async () => {
		frameworkCore.registerFlow(
			{ key: 'targetFlow' },
			'SetData("eventData", event.data);'
		);

		frameworkCore.registerFlow(
			{ key: 'triggerFlow' },
			'Trigger("targetFlow");'
		);

		await frameworkCore.triggerFlow('triggerFlow', { triggeredBy: 'test' });

		expect(frameworkCore.get('eventData')).toEqual({});
	});

	test('Trigger() handles null data parameter', async () => {
		frameworkCore.registerFlow(
			{ key: 'targetFlow' },
			'SetData("eventData", event.data);'
		);

		frameworkCore.registerFlow(
			{ key: 'triggerFlow' },
			'Trigger("targetFlow", null);'
		);

		await frameworkCore.triggerFlow('triggerFlow', { triggeredBy: 'test' });

		expect(frameworkCore.get('eventData')).toEqual({});
	});

	test('Trigger() preserves existing flowStack from event', async () => {
		frameworkCore.registerFlow(
			{ key: 'targetFlow' },
			'SetData("eventData", { flowStack: event.flowStack });'
		);

		frameworkCore.registerFlow(
			{ key: 'triggerFlow' },
			'Trigger("targetFlow", { test: "data" });'
		);

		// Start with an existing flowStack
		await frameworkCore.triggerFlow(
			'triggerFlow',
			{
				triggeredBy: 'test',
				flowStack: ['originalFlow'],
			},
			'triggerFlow'
		);

		const eventData = frameworkCore.get('eventData');
		expect(eventData.flowStack).toEqual(['originalFlow', 'triggerFlow']);
	});

	test('Trigger() filters out null/undefined from flowStack', async () => {
		frameworkCore.registerFlow(
			{ key: 'targetFlow' },
			'SetData("eventData", { flowStack: event.flowStack });'
		);

		frameworkCore.registerFlow(
			{ key: 'triggerFlow' },
			'Trigger("targetFlow", { test: "data" });'
		);

		// Start with flowStack containing null/undefined
		await frameworkCore.triggerFlow(
			'triggerFlow',
			{
				triggeredBy: 'test',
				flowStack: ['flowA', null, 'flowB', undefined],
			},
			'triggerFlow'
		);

		const eventData = frameworkCore.get('eventData');
		expect(eventData.flowStack).toEqual(['flowA', 'flowB', 'triggerFlow']);
	});
});
