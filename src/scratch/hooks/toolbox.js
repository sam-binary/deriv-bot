import React from 'react';
import ReactDOM from 'react-dom';
import { ArrowIcon } from '../../components/Icons.jsx';
import { translate } from '../../utils/lang/i18n';

/* eslint-disable func-names, no-underscore-dangle */

/**
 * Initializes the toolbox.
 */
Blockly.Toolbox.prototype.init = function () {
    const workspace = this.workspace_;
    const svg = this.workspace_.getParentSvg();

    /**
     * HTML container for the Toolbox menu.
     * @type {Element}
     */
    this.HtmlDiv = goog.dom.createDom(goog.dom.TagName.DIV, 'toolbox');
    this.HtmlDiv.setAttribute('dir', workspace.RTL ? 'RTL' : 'LTR');

    // deriv-bot: Create Toolbox header
    const el_toolbox_header = goog.dom.createDom(goog.dom.TagName.DIV, 'toolbox__header');
    const el_toolbox_title = goog.dom.createDom(goog.dom.TagName.DIV, 'toolbox__title');
    const el_toolbox_arrow = goog.dom.createDom(goog.dom.TagName.DIV, 'toolbox__arrow');

    el_toolbox_title.textContent = translate('Blocks Library');
    el_toolbox_header.appendChild(el_toolbox_title);
    el_toolbox_header.appendChild(el_toolbox_arrow);
    this.HtmlDiv.appendChild(el_toolbox_header);

    ReactDOM.render(<ArrowIcon className='arrow' />, el_toolbox_arrow);
    svg.parentNode.insertBefore(this.HtmlDiv, svg);

    // deriv-bot: Clicking on toolbox arrow collapses it
    Blockly.bindEventWithChecks_(el_toolbox_arrow, 'mousedown', this, () => {
        const is_collapsed = this.HtmlDiv.classList.contains('toolbox--collapsed');
        const searchInput = document.getElementById('search_input');

        if (is_collapsed) {
            searchInput.style.display = 'block';
            this.HtmlDiv.classList.remove('toolbox--collapsed');
        } else {
            searchInput.style.display = 'none';
            this.HtmlDiv.classList.add('toolbox--collapsed');
        }

        // Fire an event to re-position flyout.
        window.dispatchEvent(new Event('resize'));
    });

    // Clicking on toolbox closes popups.
    Blockly.bindEventWithChecks_(this.HtmlDiv, 'mousedown', this, function (e) {
        // Cancel any gestures in progress.
        this.workspace_.cancelCurrentGesture();

        if (Blockly.utils.isRightButton(e) || e.target === this.HtmlDiv) {
            // Close flyout.
            Blockly.hideChaff(false);
        } else {
            // Just close popups.
            Blockly.hideChaff(true);
        }
        Blockly.Touch.clearTouchIdentifier();  // Don't block future drags.
    }, /* opt_noCaptureIdentifier */ false, /* opt_noPreventDefault */ true);

    this.createFlyout_();
    this.categoryMenu_ = new Blockly.Toolbox.CategoryMenu(this, this.HtmlDiv);
    this.populate_(workspace.options.languageTree);
    this.position();
};

/**
 * Fill the toolbox with categories and blocks.
 * @param {!Node} newTree DOM tree of blocks.
 * @private
 */
Blockly.Toolbox.prototype.populate_ = function (newTree) {
    this.categoryMenu_.populate(newTree);
};

/**
 * deriv-bot: Show blocks for a specific category in flyout
 * @private
 */
Blockly.Toolbox.prototype.showCategory_ = function (category_id) {
    let flyout_content;

    if (category_id === 'search') {
        let search_term = document.getElementById('search_input').value;
        const all_variables = this.flyout_.workspace_.getVariablesOfType('');

        if (search_term.length <= 1) {
            this.flyout_.hide();
            return;
        }

        flyout_content = {
            type      : 'search',
            blocks    : [],
            fn_blocks : {},
            var_blocks: {
                blocks     : [],
                blocks_type: [],
            },
        };

        if (typeof search_term === 'string') {
            search_term = search_term.trim().toLowerCase();
            search_term = search_term.split(' ');
        }

        const blocks = Blockly.Blocks;
        Object.keys(blocks).forEach(blockKey => {
            let keywords = ` ${blockKey}`;
            const block = blocks[blockKey];
            const block_meta = block.meta instanceof Function && block.meta();
            const block_definition = block.definition instanceof Function && block.definition();

            if (!block_meta) {
                return;
            }

            Object.keys(block_meta).forEach(key => {
                const meta = block_meta[key];
                keywords += ` ${meta}`;
            });

            Object.keys(block_definition).forEach(key => {
                const definition = block_definition[key];

                if (typeof definition === 'string') {
                    keywords += ` ${definition}`;
                } else if (definition instanceof Array) {
                    definition.forEach(def => {
                        if (def instanceof Object) {
                            keywords += !def.type.includes('image') ? ` ${JSON.stringify(def)}` : '';
                        } else {
                            keywords += ` ${def}`;
                        }
                    });
                }
            });

            const category =
                this.categoryMenu_.categories_
                    .find(menuCategory => menuCategory.id_ === block.definition().category);
            const contents = category && category.getContents();
            search_term.forEach(term => {
                if (keywords.toLowerCase().includes(term)) {
                    if (contents === 'PROCEDURE') {
                        flyout_content.fn_blocks[blockKey] = block;
                    } else if (contents === 'VARIABLE') {
                        flyout_content.var_blocks.blocks_type.push(blockKey);
                        flyout_content.var_blocks.blocks = all_variables;
                    } else if (contents instanceof Array) {
                        const filteredContents = contents
                            .filter(content => content.attributes[0].nodeValue === blockKey);

                        if (flyout_content.blocks.indexOf(filteredContents[0]) === -1) {
                            flyout_content.blocks.push(filteredContents[0]);
                        }
                    }
                }
            });
        });

        all_variables.forEach(variable => {
            search_term.forEach(term => {
                if (variable.name.toLowerCase().includes(term)
                && flyout_content.var_blocks.blocks.indexOf(variable) === -1) {
                    flyout_content.var_blocks.blocks.push(variable);
                    flyout_content.var_blocks.blocks_type = ['variables_get', 'variables_set', 'math_change'];
                }
            });
        });
    } else {
        const category = this.categoryMenu_.categories_.find(menuCategory => menuCategory.id_ === category_id);
        if (!category) {
            return;
        }

        flyout_content = [];
        flyout_content = flyout_content.concat(category.getContents());
    }

    this.flyout_.autoClose = true;
    this.flyout_.show(flyout_content);
};

/**
 * Create the DOM for the category menu.
 * deriv-bot: Custom class names
 */
Blockly.Toolbox.CategoryMenu.prototype.createDom = function () {
    const className = this.parent_.horizontalLayout_ ? 'toolbox__horizontal-category-menu' : 'toolbox__category-menu';

    this.table = goog.dom.createDom('div', className);
    this.search = goog.dom.createDom('input', {
        id         : 'search_input',
        type       : 'text',
        placeholder: 'Search',
    });
    this.parentHtml_.appendChild(this.table).appendChild(this.search);

    const search = document.getElementById('search_input');
    search.addEventListener('keyup', () => {
        const toolbox = this.parent_;

        toolbox.setSelectedItem(toolbox.categoryMenu_.categories_.find(menuCategory => menuCategory.id_ === 'search'));
    });

    // Hide flyout on scrolling the toolbox category menu in
    // order to ensure correct positioning of flyout.
    this.table.addEventListener('scroll', () => {
        const toolbox = this.parent_;
        const flyout = toolbox.flyout_;

        toolbox.setSelectedItem(null);
        flyout.hide();
    });
};

/**
 * Fill the toolbox with categories and blocks by creating a new
 * {Blockly.Toolbox.Category} for every category tag in the toolbox xml.
 * deriv-bot: Port from Google Blockly
 * @param {Node} domTree DOM tree of blocks, or null.
 */
Blockly.Toolbox.CategoryMenu.prototype.populate = function (domTree) {
    if (!domTree) {
        return;
    }

    // Remove old categories
    this.dispose();
    this.createDom();

    const categories = [];

    // Find actual categories from the DOM tree.
    domTree.childNodes.forEach((child) => {
        if (child.tagName && child.tagName.toUpperCase() === 'CATEGORY') {
            categories.push(child);
        }
    });

    categories.forEach((child) => {
        const row = goog.dom.createDom(goog.dom.TagName.DIV, 'toolbox__row');

        this.table.appendChild(row);

        if (child) {
            this.categories_.push(new Blockly.Toolbox.Category(this, row, child));
        }
    });

    this.height_ = this.table.offsetHeight;
};

/**
 * Used to determine the css classes for the menu item for this category
 * based on its current state.
 * @private
 * @param {boolean=} selected Indication whether the category is currently selected.
 * @return {string} The css class names to be applied, space-separated.
 * deriv-bot: Custom class names
 */
Blockly.Toolbox.Category.prototype.getMenuItemClassName_ = function (selected) {
    const classNames = ['toolbox__item', `toolbox__category--${this.id_}`];

    if (selected) {
        classNames.push('toolbox__category--selected');
    }

    return classNames.join(' ');
};

/**
 * Create the DOM for a category in the toolbox.
 * deriv-bot: Custom class names
 */
Blockly.Toolbox.Category.prototype.createDom = function () {
    const toolbox = this.parent_.parent_;

    this.item_ = goog.dom.createDom('div', { class: this.getMenuItemClassName_() });
    this.label_ = goog.dom.createDom('div', {
        class: 'toolbox__label',
    }, Blockly.utils.replaceMessageReferences(this.name_));

    const el_toolbox_row_color = goog.dom.createDom('div', { class: 'toolbox__color' });
    this.item_.appendChild(el_toolbox_row_color);

    this.item_.appendChild(this.label_);
    this.parentHtml_.appendChild(this.item_);

    Blockly.bindEvent_(this.item_, 'mouseup', toolbox, toolbox.setSelectedItemFactory(this));
};

/**
 * Opens the selected category
 * deriv-bot: Category-specific flyouts + removed opt_shouldScroll
 * @param {Blockly.Toolbox.Category} item The category to select.
 */
Blockly.Toolbox.prototype.setSelectedItem = function (item) {
    if (this.selectedItem_) {
        // They selected a different category but one was already open.  Close it.
        this.selectedItem_.setSelected(false);
    }
    this.selectedItem_ = item;
    if (this.selectedItem_ != null) {
        this.selectedItem_.setSelected(true);
        // Scroll flyout to the top of the selected category
        const categoryId = item.id_;
        this.showCategory_(categoryId);
    } else {
        this.flyout_.hide();
    }
};

/**
 * Update the flyout's contents without closing it.  Should be used in response
 * to a change in one of the dynamic categories, such as variables or
 * procedures.
 * deriv-bot: We don't want to showAll_() cause it'll populate the entire
 * flyout with all available blocks. This method is called by refreshToolboxSelection_()
 * which does the actual refreshing.
 */
Blockly.Toolbox.prototype.refreshSelection = function () {
};

/**
 * Move the toolbox to the edge.
 * deriv-bot: Don't set height of toolbox inline
 */
Blockly.Toolbox.prototype.position = function () {
    const treeDiv = this.HtmlDiv;

    if (!treeDiv) {
        // Not initialized yet.
        return;
    }

    const svg = this.workspace_.getParentSvg();
    const svgSize = Blockly.svgSize(svg);

    if (this.horizontalLayout_) {
        treeDiv.style.left = '0';
        treeDiv.style.height = 'auto';
        treeDiv.style.width = `${svgSize.width}px`;
        this.height = treeDiv.offsetHeight;

        if (this.toolboxPosition === Blockly.TOOLBOX_AT_TOP) {
            // Top
            treeDiv.style.top = '0';
        } else {
            // Bottom
            treeDiv.style.bottom = '0';
        }
    } else if (this.toolboxPosition === Blockly.TOOLBOX_AT_RIGHT) {
        // Right
        treeDiv.style.right = '0';
    } else {
        // Left
        treeDiv.style.left = '0';
    }

    this.flyout_.position();
};
