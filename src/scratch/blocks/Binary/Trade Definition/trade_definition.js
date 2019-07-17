import { defineContract }    from '../../images';
import { setBlockTextColor } from '../../../utils';
import config                from '../../../../constants/const';
import { translate }         from '../../../../utils/lang/i18n';

Blockly.Blocks.trade_definition = {
    init() {
        this.jsonInit(this.definition());
    },
    definition() {
        return {
            message0: translate('%1 (1) Define your trade contract %2'),
            message1: '%1',
            message2: translate('Run Once at Start: %1'),
            message3: '%1',
            message4: translate('Define Trade Options: %1'),
            message5: '%1',
            args0   : [
                {
                    type  : 'field_image',
                    src   : defineContract,
                    width : 25,
                    height: 25,
                    alt   : 'T',
                },
                {
                    type: 'input_dummy',
                },
            ],
            args1: [
                {
                    type: 'input_statement',
                    name: 'TRADE_OPTIONS',
                },
            ],
            args2: [
                {
                    type: 'input_dummy',
                },
            ],
            args3: [
                {
                    type : 'input_statement',
                    name : 'INITIALIZATION',
                    check: null,
                },
            ],
            args4: [
                {
                    type: 'input_dummy',
                },
            ],
            args5: [
                {
                    type: 'input_statement',
                    name: 'SUBMARKET',
                },
            ],
            colour         : '#2a3052',
            colourSecondary: Blockly.Colours.Binary.colourSecondary,
            colourTertiary : Blockly.Colours.Binary.colourTertiary,
            tooltip        : translate('Trade Definition tooltip'),
            category       : Blockly.Categories.Trade_Definition,
        };
    },
    meta() {
        return {
            'display_name': translate('Trade Definition'),
            'description' : translate('Define market type, stake, trade type and duration in trade'),
        };
    },
    onchange(event) {
        setBlockTextColor(this);
        if (!this.workspace || this.isInFlyout) {
            return;
        }

        if (event.type === Blockly.Events.END_DRAG) {
            this.enforceTradeDefinitionType();
        } else if (event.type === Blockly.Events.BLOCK_CREATE) {
            if (event.ids && event.ids.includes(this.id)) {
                // Maintain single instance of this block
                this.workspace.getAllBlocks(true).forEach(block => {
                    if (block.type === this.type && block.id !== this.id) {
                        block.dispose();
                    }
                });

                const tradeDefinitionMarket = this.getChildByType('trade_definition_market');
                if (!tradeDefinitionMarket) {
                    return;
                }

                const selectedMarket = tradeDefinitionMarket.getFieldValue('MARKET_LIST');
                const eventArgs = [tradeDefinitionMarket, 'field', 'MARKET_LIST', '', selectedMarket];
                const changeEvent = new Blockly.Events.BlockChange(...eventArgs);
                Blockly.Events.fire(changeEvent);
            }
        }
    },
    // Check if blocks within statement are valid, we enforce
    // this statement to only allow `trade_definition` type blocks.
    enforceTradeDefinitionType() {
        const blocksInStatement = this.getBlocksInStatement('TRADE_OPTIONS');
        blocksInStatement.forEach(block => {
            if (!/^trade_definition_.+$/.test(block.type)) {
                Blockly.Events.disable();
                block.unplug(false);
                Blockly.Events.enable();
            }
        });
    },
    requiredParamBlocks: [
        'trade_definition_market',
        'trade_definition_tradetype',
        'trade_definition_contracttype',
        'trade_definition_candleinterval',
        'trade_definition_restartbuysell',
        'trade_definition_restartonerror',
    ],
};

Blockly.JavaScript.trade_definition = block => {
    const account = $('.account-id')
        .first()
        .attr('value');
    if (!account) {
        throw Error('Please login');
    }

    const symbol = block.getChildFieldValue('trade_definition_market', 'SYMBOL_LIST') || '';
    const tradeType = block.getChildFieldValue('trade_definition_tradetype', 'TRADETYPE_LIST') || '';

    // Contract Type (not referring the block)
    const contractTypeBlock = block.getChildByType('trade_definition_contracttype');
    const contractTypeSelector = contractTypeBlock.getFieldValue('TYPE_LIST');
    const oppositesName = tradeType.toUpperCase();
    const contractTypeList =
        contractTypeSelector === 'both'
            ? config.opposites[oppositesName].map(k => Object.keys(k)[0])
            : [contractTypeSelector];

    const candleIntervalValue =
        block.getChildFieldValue('trade_definition_candleinterval', 'CANDLEINTERVAL_LIST') || 'default';
    const shouldRestartOnError = block.childValueToCode('trade_definition_restartonerror', 'RESTARTONERROR') || 'FALSE';
    const timeMachineEnabled =
        block.childValueToCode('trade_definition_restartbuysell', 'TIME_MACHINE_ENABLED') || 'FALSE';

    const initialization = Blockly.JavaScript.statementToCode(block, 'INITIALIZATION');
    const tradeOptionsStatement = Blockly.JavaScript.statementToCode(block, 'SUBMARKET');

    const code = `
    BinaryBotPrivateInit = function BinaryBotPrivateInit() {
        Bot.init('${account}', {
          symbol: '${symbol}',
          contractTypes: ${JSON.stringify(contractTypeList)},
          candleInterval: '${candleIntervalValue}',
          shouldRestartOnError: ${shouldRestartOnError},
          timeMachineEnabled: ${timeMachineEnabled},
        });
        ${initialization.trim()}
    };
      BinaryBotPrivateStart = function BinaryBotPrivateStart() {
        ${tradeOptionsStatement.trim()}
      };\n`;
    return code;
};
