import { translate } from '../../../../../utils/lang/i18n';

Blockly.Blocks.block_holder = {
    init() {
        this.jsonInit(this.definition());
    },
    definition(){
        return {
            message0: translate('Blocks inside are ignored %1 %2'),
            args0   : [
                {
                    type: 'input_dummy',
                },
                {
                    type : 'input_statement',
                    name : 'USELESS_STACK',
                    check: null,
                },
            ],
            colour         : '#fef1cf',
            colourSecondary: Blockly.Colours.Binary.colourSecondary,
            colourTertiary : Blockly.Colours.Binary.colourTertiary,
            tooltip        : translate('Put your blocks in here to prevent them from being removed'),
            category       : Blockly.Categories.Miscellaneous,
        };
    },
    meta(){
        return {
            'display_name': translate('Block Holder'),
            'description' : translate('Block Holder Description'),
        };
    },
};

Blockly.JavaScript.block_holder = () => '';
