import './blocks';
import './hooks';
import {
    isMainBlock,
    save,
    disable,
    addLoadersFirst,
    cleanUpOnLoad,
    addDomAsBlock,
    backwardCompatibility,
    fixCollapsedBlocks,
    fixArgumentAttribute,
    removeUnavailableMarkets,
    strategyHasValidTradeTypeCategory,
    cleanBeforeExport,
}                                         from './utils';
import { showDialog }                     from '../services/tradeEngine/utils/helpers';
import Interpreter                        from '../services/tradeEngine/utils/interpreter';
import GTM                                from '../utils/gtm';
import createError                        from '../utils/error';
import { translate, xml as translateXml } from '../utils/lang/i18n';
import { getLanguage }                    from '../utils/lang/lang';
import { observer as globalObserver }     from '../utils/observer';

export const scratchWorkspaceInit = async (scratch_area_name, scratch_div_name) => {
    try {
        const toolbox_xml = await fetch('dist/toolbox.xml').then(response => response.text());
        const main_xml = await fetch('dist/main.xml').then(response => response.text());
        const workspace = Blockly.inject(scratch_div_name, {
            media  : 'dist/media/',
            toolbox: toolbox_xml,
            grid   : {
                spacing: 40,
                length : 11,
                colour : '#ebebeb',
            },
            trashcan: true,
            zoom    : {
                wheel: true,
            },
        });

        // Keep in memory to allow category browsing
        workspace.initial_toolbox_xml = toolbox_xml;
        
        Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(main_xml), workspace);

        const onWorkspaceResize = () => {
            let el_scratch_area = document.getElementById(scratch_area_name);
            const scratch_area = el_scratch_area;
            const el_scratch_div = document.getElementById(scratch_div_name);
        
            let x = 0;
            let y = 0;
        
            do {
                x += el_scratch_area.offsetLeft;
                y += el_scratch_area.offsetTop;
                el_scratch_area = el_scratch_area.offsetParent;
            } while (el_scratch_area);
        
            // Position scratch_div over scratch_area.
            el_scratch_div.style.left   = `${x}px`;
            el_scratch_div.style.top    = `${y}px`;
            el_scratch_div.style.width  = `${scratch_area.offsetWidth}px`;
            el_scratch_div.style.height = `${scratch_area.offsetHeight}px`;
            
            Blockly.svgResize(workspace);
            // eslint-disable-next-line no-underscore-dangle
            workspace.toolbox_.flyout_.position();
        };

        // Resize workspace on workspace event, workaround for jumping workspace.
        workspace.addChangeListener(() => Blockly.svgResize(workspace));
        window.addEventListener('resize', onWorkspaceResize);
        onWorkspaceResize();
    } catch (error) {
        // TODO: Handle error.
        throw error;
    }
};

const setBeforeUnload = off => {
    if (off) {
        window.onbeforeunload = null;
    } else {
        window.onbeforeunload = () => 'You have some unsaved blocks, do you want to save them before you exit?';
    }
};

const disableStrayBlocks = () => {
    const topBlocks = Blockly.mainWorkspace.getTopBlocks();
    topBlocks.forEach(block => {
        if (
            !isMainBlock(block.type) &&
            ['block_holder', 'tick_analysis', 'loader', 'procedures_defreturn', 'procedures_defnoreturn'].indexOf(
                block.type
            ) < 0 &&
            !block.disabled
        ) {
            disable(block, translate('Blocks must be inside block holders, main blocks or functions'));
        }
    });
};

const marketsWereRemoved = xml => {
    if (!Array.from(xml.children).every(block => !removeUnavailableMarkets(block))) {
        if (window.trackJs) {
            trackJs.track('Invalid financial market');
        }
        showDialog({
            title  : translate('Warning'),
            text   : [translate('This strategy is not available in your country.')],
            buttons: [
                {
                    text : translate('OK'),
                    class: 'button-primary',
                    click() {
                        $(this).dialog('close');
                    },
                },
            ],
        })
            .then(() => {})
            .catch(() => {});
        return true;
    }
    return false;
};

export const loadWorkspace = xml => {
    if (!strategyHasValidTradeTypeCategory(xml)) return;
    if (marketsWereRemoved(xml)) return;

    Blockly.Events.setGroup('load');
    Blockly.mainWorkspace.clear();

    Array.from(xml.children).forEach(block => {
        backwardCompatibility(block);
    });

    fixArgumentAttribute(xml);
    Blockly.Xml.domToWorkspace(xml, Blockly.mainWorkspace);
    addLoadersFirst(xml).then(
        () => {
            fixCollapsedBlocks();
            Blockly.Events.setGroup(false);
            globalObserver.emit('ui.log.success', translate('Blocks are loaded successfully'));
        },
        e => {
            Blockly.Events.setGroup(false);
            throw e;
        }
    );
};

export const loadBlocks = (xml, dropEvent = {}) => {
    if (!strategyHasValidTradeTypeCategory(xml)) return;
    if (marketsWereRemoved(xml)) return;

    const variables = xml.getElementsByTagName('variables');
    if (variables.length > 0) {
        Blockly.Xml.domToVariables(variables[0], Blockly.mainWorkspace);
    }
    Blockly.Events.setGroup('load');
    addLoadersFirst(xml).then(
        loaders => {
            const addedBlocks = [
                ...loaders,
                ...Array.from(xml.children)
                    .map(block => addDomAsBlock(block))
                    .filter(b => b),
            ];
            cleanUpOnLoad(addedBlocks, dropEvent);
            fixCollapsedBlocks();
            globalObserver.emit('ui.log.success', translate('Blocks are loaded successfully'));
        },
        e => {
            throw e;
        }
    );
};

const xmlToStr = xml => {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(xml);
};

const addBlocklyTranslation = () => {
    $.ajaxPrefilter(options => {
        options.async = true; // eslint-disable-line no-param-reassign
    });
    let lang = getLanguage();
    if (lang === 'ach') {
        lang = 'en';
    } else if (lang === 'zh_cn') {
        lang = 'zh-hans';
    } else if (lang === 'zh_tw') {
        lang = 'zh-hant';
    }
    return new Promise(resolve => {
        $.getScript(`translations/${lang}.js`, resolve);
    });
};

const onresize = () => {
    let element = document.getElementById('blocklyArea');
    const blocklyArea = element;
    const blocklyDiv = document.getElementById('blocklyDiv');
    let x = 0;
    let y = 0;
    do {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = element.offsetParent;
    } while (element);
    // Position blocklyDiv over blocklyArea.
    blocklyDiv.style.left = `${x}px`;
    blocklyDiv.style.top = `${y}px`;
    blocklyDiv.style.width = `${blocklyArea.offsetWidth}px`;
    blocklyDiv.style.height = `${blocklyArea.offsetHeight}px`;
};

const render = workspace => () => {
    onresize();
    Blockly.svgResize(workspace);
};

const overrideBlocklyDefaultShape = () => {
    const addDownloadToMenu = block => {
        if (block instanceof Object) {
            // eslint-disable-next-line no-param-reassign, max-len
            block.customContextMenu = function(options) {
                options.push({
                    text    : translate('Download'),
                    enabled : true,
                    callback: () => {
                        const xml = Blockly.Xml.textToDom(
                            '<xml xmlns="http://www.w3.org/1999/xhtml" collection="false"></xml>'
                        );
                        xml.appendChild(Blockly.Xml.blockToDom(this));
                        save('deriv-bot-block', true, xml);
                    },
                });
            };
        }
    };
    Object.keys(Blockly.Blocks).forEach(blockName => {
        const downloadDisabledBlocks = ['controls_forEach', 'controls_for', 'variables_get', 'variables_set'];
        if (!downloadDisabledBlocks.includes(blockName)) {
            addDownloadToMenu(Blockly.Blocks[blockName]);
        }
    });
};

const repaintDefaultColours = () => {
    Blockly.Msg.LOGIC_HUE = '#DEDEDE';
    Blockly.Msg.LOOPS_HUE = '#DEDEDE';
    Blockly.Msg.MATH_HUE = '#DEDEDE';
    Blockly.Msg.TEXTS_HUE = '#DEDEDE';
    Blockly.Msg.LISTS_HUE = '#DEDEDE';
    Blockly.Msg.COLOUR_HUE = '#DEDEDE';
    Blockly.Msg.VARIABLES_HUE = '#DEDEDE';
    Blockly.Msg.VARIABLES_DYNAMIC_HUE = '#DEDEDE';
    Blockly.Msg.PROCEDURES_HUE = '#DEDEDE';

    // Blockly.Blocks.logic.HUE = '#DEDEDE';
    // Blockly.Blocks.loops.HUE = '#DEDEDE';
    // Blockly.Blocks.math.HUE = '#DEDEDE';
    // Blockly.Blocks.texts.HUE = '#DEDEDE';
    // Blockly.Blocks.lists.HUE = '#DEDEDE';
    // Blockly.Blocks.colour.HUE = '#DEDEDE';
    // Blockly.Blocks.variables.HUE = '#DEDEDE';
    // Blockly.Blocks.procedures.HUE = '#DEDEDE';
};

export default class _Blockly {
    constructor() {
        this.blocksXmlStr = '';
        this.generatedJs = '';
        // eslint-disable-next-line no-underscore-dangle
        // Blockly.WorkspaceSvg.prototype.preloadAudio_ = () => {}; // https://github.com/google/blockly/issues/299
        this.initPromise = new Promise(resolve => {
            $.get('xml/toolbox.xml', toolboxXml => {
                const workspace = Blockly.inject('blocklyDiv', {
                    toolbox: xmlToStr(translateXml(toolboxXml.getElementsByTagName('xml')[0])),
                    zoom   : {
                        wheel     : true,
                        startScale: 1.1,
                    },
                    trashcan  : true,
                    scrollbars: true,
                    media     : 'image/scratch/',
                });
                workspace.addChangeListener(event => {
                    if (event.type === Blockly.Events.BLOCK_CREATE) {
                        event.ids.forEach(id => {
                            const block = workspace.getBlockById(id);
                            if (block) {
                                GTM.pushDataLayer({
                                    event     : 'Block Event',
                                    blockEvent: event.type,
                                    blockType : block.type,
                                });
                            }
                        });
                    } else if (event.type === Blockly.Events.BLOCK_DELETE) {
                        const dom = Blockly.Xml.textToDom(`<xml>${event.oldXml.outerHTML}</xml>`);
                        const blockNodes = dom.getElementsByTagName('block');
                        Array.from(blockNodes).forEach(blockNode => {
                            GTM.pushDataLayer({
                                event     : 'Block Event',
                                blockEvent: event.type,
                                blockType : blockNode.getAttribute('type'),
                            });
                        });
                    }
                });

                const renderInstance = render(workspace);
                window.addEventListener('resize', renderInstance, false);
                renderInstance();
                addBlocklyTranslation().then(() => {
                    $.get('xml/main.xml', main => {
                        repaintDefaultColours();
                        overrideBlocklyDefaultShape();
                        this.blocksXmlStr = Blockly.Xml.domToPrettyText(main);
                        Blockly.Xml.domToWorkspace(main.getElementsByTagName('xml')[0], workspace);
                        this.zoomOnPlusMinus();
                        setTimeout(() => {
                            setBeforeUnload(true);
                            Blockly.mainWorkspace.cleanUp();
                            Blockly.mainWorkspace.clearUndo();
                        }, 0);
                        resolve();
                    });
                });
            });
        });
    }

    /* eslint-disable class-methods-use-this */
    zoomOnPlusMinus(zoomIn) {
        const metrics = Blockly.mainWorkspace.getMetrics();
        if (zoomIn) {
            Blockly.mainWorkspace.zoom(metrics.viewWidth / 2, metrics.viewHeight / 2, 1);
        } else {
            Blockly.mainWorkspace.zoom(metrics.viewWidth / 2, metrics.viewHeight / 2, -1);
        }
    }

    resetWorkspace() {
        Blockly.Events.setGroup('reset');
        Blockly.mainWorkspace.clear();
        Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(this.blocksXmlStr), Blockly.mainWorkspace);
        Blockly.Events.setGroup(false);
    }

    /* eslint-disable class-methods-use-this */
    cleanUp() {
        Blockly.Events.setGroup(true);
        const topBlocks = Blockly.mainWorkspace.getTopBlocks(true);
        let cursorY = 0;
        topBlocks.forEach(block => {
            if (block.getSvgRoot().style.display !== 'none') {
                const xy = block.getRelativeToSurfaceXY();
                block.moveBy(-xy.x, cursorY - xy.y);
                block.snapToGrid();
                cursorY =
                    block.getRelativeToSurfaceXY().y + block.getHeightWidth().height + Blockly.BlockSvg.MIN_BLOCK_Y;
            }
        });
        Blockly.Events.setGroup(false);
        // Fire an event to allow scrollbars to resize.
        Blockly.mainWorkspace.resizeContents();
    }

    /* eslint-disable class-methods-use-this */
    load(blockStr = '', dropEvent = {}) {
        let xml;

        try {
            xml = Blockly.Xml.textToDom(blockStr);
        } catch (e) {
            throw createError('FileLoad', translate('Unrecognized file format'));
        }

        try {
            if (xml.hasAttribute('collection') && xml.getAttribute('collection') === 'true') {
                loadBlocks(xml, dropEvent);
            } else {
                loadWorkspace(xml);
            }
        } catch (e) {
            throw createError('FileLoad', translate('Unable to load the block file'));
        }
    }

    /* eslint-disable class-methods-use-this */
    save(arg) {
        const { filename, collection } = arg;

        setBeforeUnload(true);

        const xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
        cleanBeforeExport(xml);

        save(filename, collection, xml);
    }

    run(limitations = {}) {
        disableStrayBlocks();

        let code;
        try {
            code = `
var BinaryBotPrivateInit, BinaryBotPrivateStart, BinaryBotPrivateBeforePurchase, BinaryBotPrivateDuringPurchase, BinaryBotPrivateAfterPurchase;
var BinaryBotPrivateLastTickTime
var BinaryBotPrivateTickAnalysisList = [];
function BinaryBotPrivateRun(f, arg) {
 if (f) return f(arg);
 return false;
}
function BinaryBotPrivateTickAnalysis() {
 var currentTickTime = Bot.getLastTick(true).epoch
 if (currentTickTime === BinaryBotPrivateLastTickTime) {
   return
 }
 BinaryBotPrivateLastTickTime = currentTickTime
 for (var BinaryBotPrivateI = 0; BinaryBotPrivateI < BinaryBotPrivateTickAnalysisList.length; BinaryBotPrivateI++) {
   BinaryBotPrivateRun(BinaryBotPrivateTickAnalysisList[BinaryBotPrivateI]);
 }
}
var BinaryBotPrivateLimitations = ${JSON.stringify(limitations)};
${Blockly.JavaScript.workspaceToCode(Blockly.mainWorkspace)}
BinaryBotPrivateRun(BinaryBotPrivateInit);
while(true) {
 BinaryBotPrivateTickAnalysis();
 BinaryBotPrivateRun(BinaryBotPrivateStart)
 while(watch('before')) {
   BinaryBotPrivateTickAnalysis();
   BinaryBotPrivateRun(BinaryBotPrivateBeforePurchase);
 }
 while(watch('during')) {
   BinaryBotPrivateTickAnalysis();
   BinaryBotPrivateRun(BinaryBotPrivateDuringPurchase);
 }
 BinaryBotPrivateTickAnalysis();
 if(!BinaryBotPrivateRun(BinaryBotPrivateAfterPurchase)) {
   break;
 }
}
       `;
            this.generatedJs = code;
            if (code) {
                this.stop(true);
                this.interpreter = new Interpreter();
                this.interpreter.run(code).catch(e => {
                    globalObserver.emit('Error', e);
                    this.stop();
                });
            }
        } catch (e) {
            globalObserver.emit('Error', e);
            this.stop();
        }
    }

    stop(stopBeforeStart) {
        if (!stopBeforeStart) {
            const $runButtons = $('#runButton, #summaryRunButton');
            const $stopButtons = $('#stopButton, #summaryStopButton');
            if ($runButtons.is(':visible') || $stopButtons.is(':visible')) {
                $runButtons.show();
                $stopButtons.hide();
            }
        }
        if (this.interpreter) {
            this.interpreter.stop();
            this.interpreter = null;
        }
    }

    /* eslint-disable class-methods-use-this */
    undo() {
        Blockly.Events.setGroup('undo');
        Blockly.mainWorkspace.undo();
        Blockly.Events.setGroup(false);
    }

    /* eslint-disable class-methods-use-this */
    redo() {
        Blockly.mainWorkspace.undo(true);
    }

    /* eslint-disable class-methods-use-this */
    hasStarted() {
        return this.interpreter && this.interpreter.hasStarted();
    }
    /* eslint-enable */
}
