    function ScaleIcon(props) {
      const size = (props && props.size) || 16;
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, style: { flex: 'none', display: 'block' } },
        h('path', {
          d: 'M12 3v17M8 20h8M12 6l-6 2M12 6l6 2M6 8l-2.5 5a3 3 0 0 0 5 0L6 8zM18 8l-2.5 5a3 3 0 0 0 5 0L18 8z',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    return {
      name: 'law-workbench',
      inject: ['slots'],
      apply(ctx) {

        try {
          window.__lawWorkbenchTest = { extractPageRefs, extractMessages };
        } catch {
          /* 非浏览器环境忽略 */
        }

        ctx.effect(
          () =>
            ctx.slots.inject('main', () =>
              ctx.slots.register({ name: 'main', key: PANEL_ID }, (slotProps) => h(Workbench, { hostCtx: ctx, slotProps: slotProps || {} })),
            ),
          'law-workbench: main panel',
        );
        ctx.effect(
          () =>
            ctx.slots.inject('sidebar.panellist', () =>
              ctx.slots.register(
                { name: 'sidebar.panellist', id: PANEL_ID, order: 3, label: () => '律师工作台' },
                (owner = {}) => h(ScaleIcon, { size: owner.size ?? 16 }),
              ),
            ),
          'law-workbench: sidebar entry',
        );
      },
    };
