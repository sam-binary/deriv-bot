import { translate } from '../../../../../utils/lang/i18n';

Blockly.Blocks.is_candle_black = {
    init() {
        this.jsonInit(this.definition());
    },
    definition(){
        return {
            message0: translate('Is candle black? %1'),
            args0   : [
                {
                    type : 'input_value',
                    name : 'OHLCOBJ',
                    check: 'Candle',
                },
            ],
            output         : 'Boolean',
            outputShape    : Blockly.OUTPUT_SHAPE_HEXAGONAL,
            colour         : Blockly.Colours.Binary.colour,
            colourSecondary: Blockly.Colours.Binary.colourSecondary,
            colourTertiary : Blockly.Colours.Binary.colourTertiary,
            tooltip        : translate(
                'Checks if the given candle is black, returns true if close is less than open in the given candle.'
            ),
            category: Blockly.Categories.Candle,
        };
    },
    meta(){
        return {
            'display_name': translate('Is Candle Block'),
            'description' : translate('Is Candle Black Description'),
        };
    },
};

Blockly.JavaScript.is_candle_black = block => {
    const ohlcObj = Blockly.JavaScript.valueToCode(block, 'OHLCOBJ') || '{}';

    const code = `Bot.isCandleBlack(${ohlcObj})`;
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
};
