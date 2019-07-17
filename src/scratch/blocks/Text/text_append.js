import { translate } from '../../../utils/lang/i18n';

Blockly.Blocks.text_append = {
    init() {
        this.jsonInit(this.definition());
    },
    definition(){
        return {
            message0: translate('to %1 append text %2'),
            args0   : [
                {
                    type    : 'field_variable',
                    name    : 'VAR',
                    variable: translate('text'),
                },
                {
                    type: 'input_value',
                    name: 'TEXT',
                },
            ],
            colour           : Blockly.Colours.Binary.colour,
            colourSecondary  : Blockly.Colours.Binary.colourSecondary,
            colourTertiary   : Blockly.Colours.Binary.colourTertiary,
            previousStatement: null,
            nextStatement    : null,
            tooltip          : translate('Text Append Tooltip'),
            category         : Blockly.Categories.Text,
        };
    },
    meta(){
        return {
            'display_name': translate('Text Append'),
            'description' : translate('Text Append Description'),
        };
    },
};

Blockly.JavaScript.text_append = block => {
    const forceString = value => {
        const strRegExp = /^\s*'([^']|\\')*'\s*$/;
        if (strRegExp.test(value)) {
            return value;
        }
        return `String(${value})`;
    };

    // eslint-disable-next-line no-underscore-dangle
    const varName = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    const value = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_NONE) || '\'\'';

    const code = `${varName} += ${forceString(value)};\n`;
    return code;
};
