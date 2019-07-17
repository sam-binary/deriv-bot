import { translate } from '../../../../utils/lang/i18n';

Blockly.Blocks.lists_isEmpty = {
    init() {
        this.jsonInit(this.definition());
    },
    definition(){
        return {
            message0: translate('list %1 is empty'),
            args0   : [
                {
                    type : 'input_value',
                    name : 'VALUE',
                    check: ['Array'],
                },
            ],
            output         : 'Boolean',
            outputShape    : Blockly.OUTPUT_SHAPE_HEXAGONAL,
            colour         : Blockly.Colours.Binary.colour,
            colourSecondary: Blockly.Colours.Binary.colourSecondary,
            colourTertiary : Blockly.Colours.Binary.colourTertiary,
            tooltip        : translate('List is Empty Tooltip'),
            category       : Blockly.Categories.List,
        };
    },
    meta(){
        return {
            'display_name': translate('List is Empty'),
            'description' : translate('List is empty Description'),
        };
    },
};

Blockly.JavaScript.lists_isEmpty = block => {
    const list = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_MEMBER) || '[]';
    const isVariable = block.workspace.getAllVariables().findIndex(variable => variable.name === list) !== -1;

    const code = isVariable ? `!${list} || !${list}.length` : `!${list}.length`;
    return [code, Blockly.JavaScript.ORDER_LOGICAL_NOT];
};
