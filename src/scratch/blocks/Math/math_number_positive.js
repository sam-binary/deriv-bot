import { translate } from '../../../utils/lang/i18n';

Blockly.Blocks.math_number_positive = {
    init: Blockly.Blocks.math_number.init,
    definition(){
        return {
            message0: '%1',
            args0   : [
                {
                    type : 'field_number',
                    name : 'NUM',
                    value: 0,
                },
            ],
            output         : 'Number',
            outputShape    : Blockly.OUTPUT_SHAPE_ROUND,
            colour         : '#dedede',
            colourSecondary: '#ffffff',
            colourTertiary : '#ffffff',
            tooltip        : translate('Math Number Tooltip'),
            category       : 'mathematical',
        };
    },
    meta() {
        return {
            'display_name': translate('Math Number Positive'),
            'description' : translate('Math Number Description'),
        };
    },
    numberValidator(input) {
        if (/^([0][,.]|[1-9]+[,.])?([0]|[1-9])*$/.test(input)) {
            return undefined;
        }
        return null;
    },
};

Blockly.JavaScript.math_number_positive = block => {
    const code = block.getFieldValue('NUM');
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
};
