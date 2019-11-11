
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        if (component.$$.props.indexOf(name) === -1)
            return;
        component.$$.bound[name] = callback;
        callback(component.$$.ctx[name]);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/components/Button.svelte generated by Svelte v3.12.1 */

    const file = "src/components/Button.svelte";

    function create_fragment(ctx) {
    	var button, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			attr_dev(button, "class", "svelte-fu94hp");
    			toggle_class(button, "fill", ctx.type == 'fill');
    			toggle_class(button, "no-outline", ctx.type == 'no-outline');
    			toggle_class(button, "outline", ctx.type == 'outline');
    			toggle_class(button, "default", ctx.size == 'default');
    			toggle_class(button, "small", ctx.size == 'small');
    			toggle_class(button, "primary", ctx.color == 'primary');
    			toggle_class(button, "secondary", ctx.color == 'secondary');
    			toggle_class(button, "error", ctx.color == 'error');
    			add_location(button, file, 107, 0, 3270);
    			dispose = listen_dev(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if (changed.type) {
    				toggle_class(button, "fill", ctx.type == 'fill');
    				toggle_class(button, "no-outline", ctx.type == 'no-outline');
    				toggle_class(button, "outline", ctx.type == 'outline');
    			}

    			if (changed.size) {
    				toggle_class(button, "default", ctx.size == 'default');
    				toggle_class(button, "small", ctx.size == 'small');
    			}

    			if (changed.color) {
    				toggle_class(button, "primary", ctx.color == 'primary');
    				toggle_class(button, "secondary", ctx.color == 'secondary');
    				toggle_class(button, "error", ctx.color == 'error');
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { type = "fill", size = "default", color = "primary" } = $$props;

    	const writable_props = ['type', 'size', 'color'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('size' in $$props) $$invalidate('size', size = $$props.size);
    		if ('color' in $$props) $$invalidate('color', color = $$props.color);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { type, size, color };
    	};

    	$$self.$inject_state = $$props => {
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('size' in $$props) $$invalidate('size', size = $$props.size);
    		if ('color' in $$props) $$invalidate('color', color = $$props.color);
    	};

    	return {
    		type,
    		size,
    		color,
    		click_handler,
    		$$slots,
    		$$scope
    	};
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["type", "size", "color"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Button", options, id: create_fragment.name });
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Status.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/components/Status.svelte";

    function create_fragment$1(ctx) {
    	var span, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			span = element("span");

    			if (default_slot) default_slot.c();

    			attr_dev(span, "class", "svelte-1fnreal");
    			toggle_class(span, "success", ctx.type == 'success');
    			toggle_class(span, "primary", ctx.type == 'primary');
    			toggle_class(span, "secondary", ctx.type == 'warn');
    			toggle_class(span, "error", ctx.type == 'error');
    			add_location(span, file$1, 41, 0, 1036);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(span_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if (changed.type) {
    				toggle_class(span, "success", ctx.type == 'success');
    				toggle_class(span, "primary", ctx.type == 'primary');
    				toggle_class(span, "secondary", ctx.type == 'warn');
    				toggle_class(span, "error", ctx.type == 'error');
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(span);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { type = "primary" } = $$props;

    	const writable_props = ['type'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Status> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { type };
    	};

    	$$self.$inject_state = $$props => {
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    	};

    	return { type, $$slots, $$scope };
    }

    class Status extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["type"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Status", options, id: create_fragment$1.name });
    	}

    	get type() {
    		throw new Error("<Status>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Status>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Input.svelte generated by Svelte v3.12.1 */

    const file$2 = "src/components/Input.svelte";

    function create_fragment$2(ctx) {
    	var div1, div0, label_1, t0, t1, input, dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			label_1 = element("label");
    			t0 = text(ctx.label);
    			t1 = space();
    			input = element("input");
    			attr_dev(label_1, "class", "svelte-1lvpgrj");
    			add_location(label_1, file$2, 89, 4, 2183);
    			attr_dev(div0, "class", "label-wrapper svelte-1lvpgrj");
    			add_location(div0, file$2, 88, 2, 2151);
    			attr_dev(input, "id", ctx.id);
    			attr_dev(input, "type", "text");
    			input.readOnly = ctx.readonly;
    			attr_dev(input, "name", ctx.name);
    			input.disabled = ctx.disabled;
    			attr_dev(input, "placeholder", ctx.placeholder);
    			attr_dev(input, "class", "svelte-1lvpgrj");
    			add_location(input, file$2, 91, 2, 2217);
    			attr_dev(div1, "class", "form-field svelte-1lvpgrj");
    			toggle_class(div1, "primary", ctx.color == 'primary');
    			toggle_class(div1, "secondary", ctx.color == 'secondary');
    			toggle_class(div1, "error", ctx.color == 'error');
    			add_location(div1, file$2, 82, 0, 2010);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler),
    				listen_dev(input, "blur", ctx.blur_handler),
    				listen_dev(input, "focus", ctx.focus_handler),
    				listen_dev(input, "keydown", ctx.keydown_handler),
    				listen_dev(input, "keypress", ctx.keypress_handler),
    				listen_dev(input, "keyup", ctx.keyup_handler),
    				listen_dev(input, "change", ctx.change_handler),
    				listen_dev(input, "input", ctx.input_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, label_1);
    			append_dev(label_1, t0);
    			append_dev(div1, t1);
    			append_dev(div1, input);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t0, ctx.label);
    			}

    			if (changed.value && (input.value !== ctx.value)) set_input_value(input, ctx.value);

    			if (changed.id) {
    				attr_dev(input, "id", ctx.id);
    			}

    			if (changed.readonly) {
    				prop_dev(input, "readOnly", ctx.readonly);
    			}

    			if (changed.name) {
    				attr_dev(input, "name", ctx.name);
    			}

    			if (changed.disabled) {
    				prop_dev(input, "disabled", ctx.disabled);
    			}

    			if (changed.placeholder) {
    				attr_dev(input, "placeholder", ctx.placeholder);
    			}

    			if (changed.color) {
    				toggle_class(div1, "primary", ctx.color == 'primary');
    				toggle_class(div1, "secondary", ctx.color == 'secondary');
    				toggle_class(div1, "error", ctx.color == 'error');
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { color = "primary", type = "text", label = "", valid = false, invalid = false, value = "", readonly = false, id = "", name = "", placeholder = "", disabled = false } = $$props;

      let tag;

    	const writable_props = ['color', 'type', 'label', 'valid', 'invalid', 'value', 'readonly', 'id', 'name', 'placeholder', 'disabled'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function focus_handler(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler(event) {
    		bubble($$self, event);
    	}

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('color' in $$props) $$invalidate('color', color = $$props.color);
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('valid' in $$props) $$invalidate('valid', valid = $$props.valid);
    		if ('invalid' in $$props) $$invalidate('invalid', invalid = $$props.invalid);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('readonly' in $$props) $$invalidate('readonly', readonly = $$props.readonly);
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => {
    		return { color, type, label, valid, invalid, value, readonly, id, name, placeholder, disabled, tag };
    	};

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate('color', color = $$props.color);
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('valid' in $$props) $$invalidate('valid', valid = $$props.valid);
    		if ('invalid' in $$props) $$invalidate('invalid', invalid = $$props.invalid);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('readonly' in $$props) $$invalidate('readonly', readonly = $$props.readonly);
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('tag' in $$props) tag = $$props.tag;
    	};

    	return {
    		color,
    		type,
    		label,
    		valid,
    		invalid,
    		value,
    		readonly,
    		id,
    		name,
    		placeholder,
    		disabled,
    		blur_handler,
    		focus_handler,
    		keydown_handler,
    		keypress_handler,
    		keyup_handler,
    		change_handler,
    		input_handler,
    		input_input_handler
    	};
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["color", "type", "label", "valid", "invalid", "value", "readonly", "id", "name", "placeholder", "disabled"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Input", options, id: create_fragment$2.name });
    	}

    	get color() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valid() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valid(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invalid() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalid(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get readonly() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set readonly(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Checkbox.svelte generated by Svelte v3.12.1 */

    const file$3 = "src/components/Checkbox.svelte";

    function create_fragment$3(ctx) {
    	var label, t0, input, t1, span, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			label = element("label");

    			if (default_slot) default_slot.c();
    			t0 = space();
    			input = element("input");
    			t1 = space();
    			span = element("span");

    			attr_dev(input, "type", "checkbox");
    			input.checked = "checked";
    			attr_dev(input, "class", "svelte-x7ruoh");
    			add_location(input, file$3, 97, 2, 2264);
    			attr_dev(span, "class", "checkmark svelte-x7ruoh");
    			add_location(span, file$3, 98, 2, 2310);
    			attr_dev(label, "class", "container svelte-x7ruoh");
    			toggle_class(label, "success", ctx.color == 'success');
    			toggle_class(label, "primary", ctx.color == 'primary');
    			toggle_class(label, "secondary", ctx.color == 'secondary');
    			toggle_class(label, "error", ctx.color == 'error');
    			add_location(label, file$3, 90, 0, 2075);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(label_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);

    			if (default_slot) {
    				default_slot.m(label, null);
    			}

    			append_dev(label, t0);
    			append_dev(label, input);
    			append_dev(label, t1);
    			append_dev(label, span);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if (changed.color) {
    				toggle_class(label, "success", ctx.color == 'success');
    				toggle_class(label, "primary", ctx.color == 'primary');
    				toggle_class(label, "secondary", ctx.color == 'secondary');
    				toggle_class(label, "error", ctx.color == 'error');
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(label);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { color = "primary" } = $$props;

    	const writable_props = ['color'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Checkbox> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('color' in $$props) $$invalidate('color', color = $$props.color);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { color };
    	};

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate('color', color = $$props.color);
    	};

    	return { color, $$slots, $$scope };
    }

    class Checkbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["color"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Checkbox", options, id: create_fragment$3.name });
    	}

    	get color() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    const file$4 = "src/App.svelte";

    // (18:0) <Button on:click={sayHello}>
    function create_default_slot_22(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_22.name, type: "slot", source: "(18:0) <Button on:click={sayHello}>", ctx });
    	return block;
    }

    // (19:0) <Button type="no-outline">
    function create_default_slot_21(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_21.name, type: "slot", source: "(19:0) <Button type=\"no-outline\">", ctx });
    	return block;
    }

    // (20:0) <Button type="outline">
    function create_default_slot_20(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_20.name, type: "slot", source: "(20:0) <Button type=\"outline\">", ctx });
    	return block;
    }

    // (23:0) <Button size="small">
    function create_default_slot_19(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_19.name, type: "slot", source: "(23:0) <Button size=\"small\">", ctx });
    	return block;
    }

    // (24:0) <Button size="small" type="no-outline">
    function create_default_slot_18(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_18.name, type: "slot", source: "(24:0) <Button size=\"small\" type=\"no-outline\">", ctx });
    	return block;
    }

    // (25:0) <Button size="small" type="outline">
    function create_default_slot_17(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_17.name, type: "slot", source: "(25:0) <Button size=\"small\" type=\"outline\">", ctx });
    	return block;
    }

    // (28:0) <Button color="secondary">
    function create_default_slot_16(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_16.name, type: "slot", source: "(28:0) <Button color=\"secondary\">", ctx });
    	return block;
    }

    // (29:0) <Button color="secondary" type="no-outline">
    function create_default_slot_15(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_15.name, type: "slot", source: "(29:0) <Button color=\"secondary\" type=\"no-outline\">", ctx });
    	return block;
    }

    // (30:0) <Button color="secondary" type="outline">
    function create_default_slot_14(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_14.name, type: "slot", source: "(30:0) <Button color=\"secondary\" type=\"outline\">", ctx });
    	return block;
    }

    // (32:0) <Button color="secondary" size="small">
    function create_default_slot_13(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_13.name, type: "slot", source: "(32:0) <Button color=\"secondary\" size=\"small\">", ctx });
    	return block;
    }

    // (33:0) <Button color="secondary" size="small" type="no-outline">
    function create_default_slot_12(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_12.name, type: "slot", source: "(33:0) <Button color=\"secondary\" size=\"small\" type=\"no-outline\">", ctx });
    	return block;
    }

    // (34:0) <Button color="secondary" size="small" type="outline">
    function create_default_slot_11(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_11.name, type: "slot", source: "(34:0) <Button color=\"secondary\" size=\"small\" type=\"outline\">", ctx });
    	return block;
    }

    // (37:0) <Button color="error">
    function create_default_slot_10(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_10.name, type: "slot", source: "(37:0) <Button color=\"error\">", ctx });
    	return block;
    }

    // (38:0) <Button color="error" type="no-outline">
    function create_default_slot_9(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_9.name, type: "slot", source: "(38:0) <Button color=\"error\" type=\"no-outline\">", ctx });
    	return block;
    }

    // (39:0) <Button color="error" type="outline">
    function create_default_slot_8(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_8.name, type: "slot", source: "(39:0) <Button color=\"error\" type=\"outline\">", ctx });
    	return block;
    }

    // (41:0) <Button color="error" size="small">
    function create_default_slot_7(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_7.name, type: "slot", source: "(41:0) <Button color=\"error\" size=\"small\">", ctx });
    	return block;
    }

    // (42:0) <Button color="error" size="small" type="no-outline">
    function create_default_slot_6(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_6.name, type: "slot", source: "(42:0) <Button color=\"error\" size=\"small\" type=\"no-outline\">", ctx });
    	return block;
    }

    // (43:0) <Button color="error" size="small" type="outline">
    function create_default_slot_5(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_5.name, type: "slot", source: "(43:0) <Button color=\"error\" size=\"small\" type=\"outline\">", ctx });
    	return block;
    }

    // (51:0) <Status>
    function create_default_slot_4(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Primary");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_4.name, type: "slot", source: "(51:0) <Status>", ctx });
    	return block;
    }

    // (52:0) <Status type="success">
    function create_default_slot_3(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Success");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3.name, type: "slot", source: "(52:0) <Status type=\"success\">", ctx });
    	return block;
    }

    // (53:0) <Status type="warn">
    function create_default_slot_2(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Warn");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2.name, type: "slot", source: "(53:0) <Status type=\"warn\">", ctx });
    	return block;
    }

    // (54:0) <Status type="error">
    function create_default_slot_1(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Error");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1.name, type: "slot", source: "(54:0) <Status type=\"error\">", ctx });
    	return block;
    }

    // (57:0) <Checkbox>
    function create_default_slot(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Primary");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot.name, type: "slot", source: "(57:0) <Checkbox>", ctx });
    	return block;
    }

    function create_fragment$4(ctx) {
    	var h30, t1, t2, t3, t4, h40, t6, t7, t8, t9, h41, t11, t12, t13, t14, t15, t16, t17, h42, t19, t20, t21, t22, t23, t24, t25, h31, t27, updating_value, t28, updating_value_1, t29, updating_value_2, t30, h32, t32, t33, t34, t35, t36, h33, t38, current;

    	var button0 = new Button({
    		props: {
    		$$slots: { default: [create_default_slot_22] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button0.$on("click", sayHello);

    	var button1 = new Button({
    		props: {
    		type: "no-outline",
    		$$slots: { default: [create_default_slot_21] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button2 = new Button({
    		props: {
    		type: "outline",
    		$$slots: { default: [create_default_slot_20] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button3 = new Button({
    		props: {
    		size: "small",
    		$$slots: { default: [create_default_slot_19] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button4 = new Button({
    		props: {
    		size: "small",
    		type: "no-outline",
    		$$slots: { default: [create_default_slot_18] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button5 = new Button({
    		props: {
    		size: "small",
    		type: "outline",
    		$$slots: { default: [create_default_slot_17] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button6 = new Button({
    		props: {
    		color: "secondary",
    		$$slots: { default: [create_default_slot_16] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button7 = new Button({
    		props: {
    		color: "secondary",
    		type: "no-outline",
    		$$slots: { default: [create_default_slot_15] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button8 = new Button({
    		props: {
    		color: "secondary",
    		type: "outline",
    		$$slots: { default: [create_default_slot_14] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button9 = new Button({
    		props: {
    		color: "secondary",
    		size: "small",
    		$$slots: { default: [create_default_slot_13] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button10 = new Button({
    		props: {
    		color: "secondary",
    		size: "small",
    		type: "no-outline",
    		$$slots: { default: [create_default_slot_12] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button11 = new Button({
    		props: {
    		color: "secondary",
    		size: "small",
    		type: "outline",
    		$$slots: { default: [create_default_slot_11] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button12 = new Button({
    		props: {
    		color: "error",
    		$$slots: { default: [create_default_slot_10] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button13 = new Button({
    		props: {
    		color: "error",
    		type: "no-outline",
    		$$slots: { default: [create_default_slot_9] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button14 = new Button({
    		props: {
    		color: "error",
    		type: "outline",
    		$$slots: { default: [create_default_slot_8] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button15 = new Button({
    		props: {
    		color: "error",
    		size: "small",
    		$$slots: { default: [create_default_slot_7] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button16 = new Button({
    		props: {
    		color: "error",
    		size: "small",
    		type: "no-outline",
    		$$slots: { default: [create_default_slot_6] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button17 = new Button({
    		props: {
    		color: "error",
    		size: "small",
    		type: "outline",
    		$$slots: { default: [create_default_slot_5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	function input0_value_binding(value_1) {
    		ctx.input0_value_binding.call(null, value_1);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let input0_props = { label: "First Name" };
    	if (ctx.value !== void 0) {
    		input0_props.value = ctx.value;
    	}
    	var input0 = new Input({ props: input0_props, $$inline: true });

    	binding_callbacks.push(() => bind(input0, 'value', input0_value_binding));
    	input0.$on("click", sayHello);

    	function input1_value_binding(value_2) {
    		ctx.input1_value_binding.call(null, value_2);
    		updating_value_1 = true;
    		add_flush_callback(() => updating_value_1 = false);
    	}

    	let input1_props = { color: "error", label: "First Name" };
    	if (ctx.value !== void 0) {
    		input1_props.value = ctx.value;
    	}
    	var input1 = new Input({ props: input1_props, $$inline: true });

    	binding_callbacks.push(() => bind(input1, 'value', input1_value_binding));
    	input1.$on("click", sayHello);

    	function input2_value_binding(value_3) {
    		ctx.input2_value_binding.call(null, value_3);
    		updating_value_2 = true;
    		add_flush_callback(() => updating_value_2 = false);
    	}

    	let input2_props = { color: "secondary", label: "First Name" };
    	if (ctx.value !== void 0) {
    		input2_props.value = ctx.value;
    	}
    	var input2 = new Input({ props: input2_props, $$inline: true });

    	binding_callbacks.push(() => bind(input2, 'value', input2_value_binding));
    	input2.$on("click", sayHello);

    	var status0 = new Status({
    		props: {
    		$$slots: { default: [create_default_slot_4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var status1 = new Status({
    		props: {
    		type: "success",
    		$$slots: { default: [create_default_slot_3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var status2 = new Status({
    		props: {
    		type: "warn",
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var status3 = new Status({
    		props: {
    		type: "error",
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var checkbox = new Checkbox({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			h30 = element("h3");
    			h30.textContent = "Buttons";
    			t1 = space();
    			button0.$$.fragment.c();
    			t2 = space();
    			button1.$$.fragment.c();
    			t3 = space();
    			button2.$$.fragment.c();
    			t4 = space();
    			h40 = element("h4");
    			h40.textContent = "Small Buttons";
    			t6 = space();
    			button3.$$.fragment.c();
    			t7 = space();
    			button4.$$.fragment.c();
    			t8 = space();
    			button5.$$.fragment.c();
    			t9 = space();
    			h41 = element("h4");
    			h41.textContent = "Secondary Buttons";
    			t11 = space();
    			button6.$$.fragment.c();
    			t12 = space();
    			button7.$$.fragment.c();
    			t13 = space();
    			button8.$$.fragment.c();
    			t14 = space();
    			button9.$$.fragment.c();
    			t15 = space();
    			button10.$$.fragment.c();
    			t16 = space();
    			button11.$$.fragment.c();
    			t17 = space();
    			h42 = element("h4");
    			h42.textContent = "Error Buttons";
    			t19 = space();
    			button12.$$.fragment.c();
    			t20 = space();
    			button13.$$.fragment.c();
    			t21 = space();
    			button14.$$.fragment.c();
    			t22 = space();
    			button15.$$.fragment.c();
    			t23 = space();
    			button16.$$.fragment.c();
    			t24 = space();
    			button17.$$.fragment.c();
    			t25 = space();
    			h31 = element("h3");
    			h31.textContent = "Input";
    			t27 = space();
    			input0.$$.fragment.c();
    			t28 = space();
    			input1.$$.fragment.c();
    			t29 = space();
    			input2.$$.fragment.c();
    			t30 = space();
    			h32 = element("h3");
    			h32.textContent = "Status";
    			t32 = space();
    			status0.$$.fragment.c();
    			t33 = space();
    			status1.$$.fragment.c();
    			t34 = space();
    			status2.$$.fragment.c();
    			t35 = space();
    			status3.$$.fragment.c();
    			t36 = space();
    			h33 = element("h3");
    			h33.textContent = "Checkboxes";
    			t38 = space();
    			checkbox.$$.fragment.c();
    			add_location(h30, file$4, 16, 0, 399);
    			add_location(h40, file$4, 21, 0, 542);
    			add_location(h41, file$4, 26, 0, 710);
    			add_location(h42, file$4, 35, 0, 1096);
    			add_location(h31, file$4, 44, 0, 1454);
    			add_location(h32, file$4, 49, 0, 1682);
    			add_location(h33, file$4, 55, 0, 1834);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(button0, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(button1, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(button2, target, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, h40, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(button3, target, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(button4, target, anchor);
    			insert_dev(target, t8, anchor);
    			mount_component(button5, target, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, h41, anchor);
    			insert_dev(target, t11, anchor);
    			mount_component(button6, target, anchor);
    			insert_dev(target, t12, anchor);
    			mount_component(button7, target, anchor);
    			insert_dev(target, t13, anchor);
    			mount_component(button8, target, anchor);
    			insert_dev(target, t14, anchor);
    			mount_component(button9, target, anchor);
    			insert_dev(target, t15, anchor);
    			mount_component(button10, target, anchor);
    			insert_dev(target, t16, anchor);
    			mount_component(button11, target, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, h42, anchor);
    			insert_dev(target, t19, anchor);
    			mount_component(button12, target, anchor);
    			insert_dev(target, t20, anchor);
    			mount_component(button13, target, anchor);
    			insert_dev(target, t21, anchor);
    			mount_component(button14, target, anchor);
    			insert_dev(target, t22, anchor);
    			mount_component(button15, target, anchor);
    			insert_dev(target, t23, anchor);
    			mount_component(button16, target, anchor);
    			insert_dev(target, t24, anchor);
    			mount_component(button17, target, anchor);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t27, anchor);
    			mount_component(input0, target, anchor);
    			insert_dev(target, t28, anchor);
    			mount_component(input1, target, anchor);
    			insert_dev(target, t29, anchor);
    			mount_component(input2, target, anchor);
    			insert_dev(target, t30, anchor);
    			insert_dev(target, h32, anchor);
    			insert_dev(target, t32, anchor);
    			mount_component(status0, target, anchor);
    			insert_dev(target, t33, anchor);
    			mount_component(status1, target, anchor);
    			insert_dev(target, t34, anchor);
    			mount_component(status2, target, anchor);
    			insert_dev(target, t35, anchor);
    			mount_component(status3, target, anchor);
    			insert_dev(target, t36, anchor);
    			insert_dev(target, h33, anchor);
    			insert_dev(target, t38, anchor);
    			mount_component(checkbox, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button0_changes = {};
    			if (changed.$$scope) button0_changes.$$scope = { changed, ctx };
    			button0.$set(button0_changes);

    			var button1_changes = {};
    			if (changed.$$scope) button1_changes.$$scope = { changed, ctx };
    			button1.$set(button1_changes);

    			var button2_changes = {};
    			if (changed.$$scope) button2_changes.$$scope = { changed, ctx };
    			button2.$set(button2_changes);

    			var button3_changes = {};
    			if (changed.$$scope) button3_changes.$$scope = { changed, ctx };
    			button3.$set(button3_changes);

    			var button4_changes = {};
    			if (changed.$$scope) button4_changes.$$scope = { changed, ctx };
    			button4.$set(button4_changes);

    			var button5_changes = {};
    			if (changed.$$scope) button5_changes.$$scope = { changed, ctx };
    			button5.$set(button5_changes);

    			var button6_changes = {};
    			if (changed.$$scope) button6_changes.$$scope = { changed, ctx };
    			button6.$set(button6_changes);

    			var button7_changes = {};
    			if (changed.$$scope) button7_changes.$$scope = { changed, ctx };
    			button7.$set(button7_changes);

    			var button8_changes = {};
    			if (changed.$$scope) button8_changes.$$scope = { changed, ctx };
    			button8.$set(button8_changes);

    			var button9_changes = {};
    			if (changed.$$scope) button9_changes.$$scope = { changed, ctx };
    			button9.$set(button9_changes);

    			var button10_changes = {};
    			if (changed.$$scope) button10_changes.$$scope = { changed, ctx };
    			button10.$set(button10_changes);

    			var button11_changes = {};
    			if (changed.$$scope) button11_changes.$$scope = { changed, ctx };
    			button11.$set(button11_changes);

    			var button12_changes = {};
    			if (changed.$$scope) button12_changes.$$scope = { changed, ctx };
    			button12.$set(button12_changes);

    			var button13_changes = {};
    			if (changed.$$scope) button13_changes.$$scope = { changed, ctx };
    			button13.$set(button13_changes);

    			var button14_changes = {};
    			if (changed.$$scope) button14_changes.$$scope = { changed, ctx };
    			button14.$set(button14_changes);

    			var button15_changes = {};
    			if (changed.$$scope) button15_changes.$$scope = { changed, ctx };
    			button15.$set(button15_changes);

    			var button16_changes = {};
    			if (changed.$$scope) button16_changes.$$scope = { changed, ctx };
    			button16.$set(button16_changes);

    			var button17_changes = {};
    			if (changed.$$scope) button17_changes.$$scope = { changed, ctx };
    			button17.$set(button17_changes);

    			var input0_changes = {};
    			if (!updating_value && changed.value) {
    				input0_changes.value = ctx.value;
    			}
    			input0.$set(input0_changes);

    			var input1_changes = {};
    			if (!updating_value_1 && changed.value) {
    				input1_changes.value = ctx.value;
    			}
    			input1.$set(input1_changes);

    			var input2_changes = {};
    			if (!updating_value_2 && changed.value) {
    				input2_changes.value = ctx.value;
    			}
    			input2.$set(input2_changes);

    			var status0_changes = {};
    			if (changed.$$scope) status0_changes.$$scope = { changed, ctx };
    			status0.$set(status0_changes);

    			var status1_changes = {};
    			if (changed.$$scope) status1_changes.$$scope = { changed, ctx };
    			status1.$set(status1_changes);

    			var status2_changes = {};
    			if (changed.$$scope) status2_changes.$$scope = { changed, ctx };
    			status2.$set(status2_changes);

    			var status3_changes = {};
    			if (changed.$$scope) status3_changes.$$scope = { changed, ctx };
    			status3.$set(status3_changes);

    			var checkbox_changes = {};
    			if (changed.$$scope) checkbox_changes.$$scope = { changed, ctx };
    			checkbox.$set(checkbox_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);

    			transition_in(button1.$$.fragment, local);

    			transition_in(button2.$$.fragment, local);

    			transition_in(button3.$$.fragment, local);

    			transition_in(button4.$$.fragment, local);

    			transition_in(button5.$$.fragment, local);

    			transition_in(button6.$$.fragment, local);

    			transition_in(button7.$$.fragment, local);

    			transition_in(button8.$$.fragment, local);

    			transition_in(button9.$$.fragment, local);

    			transition_in(button10.$$.fragment, local);

    			transition_in(button11.$$.fragment, local);

    			transition_in(button12.$$.fragment, local);

    			transition_in(button13.$$.fragment, local);

    			transition_in(button14.$$.fragment, local);

    			transition_in(button15.$$.fragment, local);

    			transition_in(button16.$$.fragment, local);

    			transition_in(button17.$$.fragment, local);

    			transition_in(input0.$$.fragment, local);

    			transition_in(input1.$$.fragment, local);

    			transition_in(input2.$$.fragment, local);

    			transition_in(status0.$$.fragment, local);

    			transition_in(status1.$$.fragment, local);

    			transition_in(status2.$$.fragment, local);

    			transition_in(status3.$$.fragment, local);

    			transition_in(checkbox.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(button3.$$.fragment, local);
    			transition_out(button4.$$.fragment, local);
    			transition_out(button5.$$.fragment, local);
    			transition_out(button6.$$.fragment, local);
    			transition_out(button7.$$.fragment, local);
    			transition_out(button8.$$.fragment, local);
    			transition_out(button9.$$.fragment, local);
    			transition_out(button10.$$.fragment, local);
    			transition_out(button11.$$.fragment, local);
    			transition_out(button12.$$.fragment, local);
    			transition_out(button13.$$.fragment, local);
    			transition_out(button14.$$.fragment, local);
    			transition_out(button15.$$.fragment, local);
    			transition_out(button16.$$.fragment, local);
    			transition_out(button17.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(status0.$$.fragment, local);
    			transition_out(status1.$$.fragment, local);
    			transition_out(status2.$$.fragment, local);
    			transition_out(status3.$$.fragment, local);
    			transition_out(checkbox.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h30);
    				detach_dev(t1);
    			}

    			destroy_component(button0, detaching);

    			if (detaching) {
    				detach_dev(t2);
    			}

    			destroy_component(button1, detaching);

    			if (detaching) {
    				detach_dev(t3);
    			}

    			destroy_component(button2, detaching);

    			if (detaching) {
    				detach_dev(t4);
    				detach_dev(h40);
    				detach_dev(t6);
    			}

    			destroy_component(button3, detaching);

    			if (detaching) {
    				detach_dev(t7);
    			}

    			destroy_component(button4, detaching);

    			if (detaching) {
    				detach_dev(t8);
    			}

    			destroy_component(button5, detaching);

    			if (detaching) {
    				detach_dev(t9);
    				detach_dev(h41);
    				detach_dev(t11);
    			}

    			destroy_component(button6, detaching);

    			if (detaching) {
    				detach_dev(t12);
    			}

    			destroy_component(button7, detaching);

    			if (detaching) {
    				detach_dev(t13);
    			}

    			destroy_component(button8, detaching);

    			if (detaching) {
    				detach_dev(t14);
    			}

    			destroy_component(button9, detaching);

    			if (detaching) {
    				detach_dev(t15);
    			}

    			destroy_component(button10, detaching);

    			if (detaching) {
    				detach_dev(t16);
    			}

    			destroy_component(button11, detaching);

    			if (detaching) {
    				detach_dev(t17);
    				detach_dev(h42);
    				detach_dev(t19);
    			}

    			destroy_component(button12, detaching);

    			if (detaching) {
    				detach_dev(t20);
    			}

    			destroy_component(button13, detaching);

    			if (detaching) {
    				detach_dev(t21);
    			}

    			destroy_component(button14, detaching);

    			if (detaching) {
    				detach_dev(t22);
    			}

    			destroy_component(button15, detaching);

    			if (detaching) {
    				detach_dev(t23);
    			}

    			destroy_component(button16, detaching);

    			if (detaching) {
    				detach_dev(t24);
    			}

    			destroy_component(button17, detaching);

    			if (detaching) {
    				detach_dev(t25);
    				detach_dev(h31);
    				detach_dev(t27);
    			}

    			destroy_component(input0, detaching);

    			if (detaching) {
    				detach_dev(t28);
    			}

    			destroy_component(input1, detaching);

    			if (detaching) {
    				detach_dev(t29);
    			}

    			destroy_component(input2, detaching);

    			if (detaching) {
    				detach_dev(t30);
    				detach_dev(h32);
    				detach_dev(t32);
    			}

    			destroy_component(status0, detaching);

    			if (detaching) {
    				detach_dev(t33);
    			}

    			destroy_component(status1, detaching);

    			if (detaching) {
    				detach_dev(t34);
    			}

    			destroy_component(status2, detaching);

    			if (detaching) {
    				detach_dev(t35);
    			}

    			destroy_component(status3, detaching);

    			if (detaching) {
    				detach_dev(t36);
    				detach_dev(h33);
    				detach_dev(t38);
    			}

    			destroy_component(checkbox, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    function sayHello() {
      console.log(confirm("Tim"));
    }

    function instance$4($$self, $$props, $$invalidate) {
    	

      let value = "tim";

    	function input0_value_binding(value_1) {
    		value = value_1;
    		$$invalidate('value', value);
    	}

    	function input1_value_binding(value_2) {
    		value = value_2;
    		$$invalidate('value', value);
    	}

    	function input2_value_binding(value_3) {
    		value = value_3;
    		$$invalidate('value', value);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	return {
    		value,
    		input0_value_binding,
    		input1_value_binding,
    		input2_value_binding
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$4.name });
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
