import { translate } from '../../../../utils/lang/i18n';

Blockly.Blocks.controls_whileUntil = {
    init() {
        this.jsonInit(this.definition());
    },
    definition(){
        return {
            message0: translate('repeat %1 %2'),
            args0   : [
                {
                    type   : 'field_dropdown',
                    name   : 'MODE',
                    options: [[translate('while'), 'WHILE'], [translate('until'), 'UNTIL']],
                },
                {
                    type : 'input_value',
                    name : 'BOOL',
                    check: 'Boolean',
                },
            ],
            message1: translate('do %1'),
            args1   : [
                {
                    type: 'input_statement',
                    name: 'DO',
                },
            ],
            colour           : Blockly.Colours.Binary.colour,
            colourSecondary  : Blockly.Colours.Binary.colourSecondary,
            colourTertiary   : Blockly.Colours.Binary.colourTertiary,
            previousStatement: null,
            nextStatement    : null,
            tooltip          : translate('Control While Tooltip'),
            category         : Blockly.Categories.Loop,
        };
    },
    meta(){
        return {
            'display_name': translate('Control While'),
            'description' : translate('Control While Description'),
        };
    },
};

Blockly.JavaScript.controls_whileUntil = block => {
    const branch = Blockly.JavaScript.statementToCode(block, 'DO');
    const until = block.getFieldValue('MODE') === 'UNTIL';
    const order = until ? Blockly.JavaScript.ORDER_LOGICAL_NOT : Blockly.JavaScript.ORDER_NONE;
    let argument0 = Blockly.JavaScript.valueToCode(block, 'BOOL', order) || 'false';

    if (until) {
        argument0 = `!${argument0}`;
    }

    // eslint-disable-next-line no-underscore-dangle
    const maxLoopVar = Blockly.JavaScript.variableDB_.getDistinctName('maxLoops', Blockly.Variables.NAME_TYPE);
    // eslint-disable-next-line no-underscore-dangle
    const currentLoopVar = Blockly.JavaScript.variableDB_.getDistinctName('currentLoop', Blockly.Variables.NAME_TYPE);

    return `
        var ${maxLoopVar} = 10000;
        var ${currentLoopVar} = 0;

        while (${argument0}) {
            if (${currentLoopVar} > ${maxLoopVar}) {
                throw new Error("${translate('Infinite loop detected')}");
            } else {
                ${currentLoopVar}++;
            }
            
            ${branch}
        }\n`;
};
