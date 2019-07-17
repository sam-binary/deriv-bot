import { translate } from '../../../../utils/lang/i18n';

Blockly.Blocks.ticks = {
    init() {
        this.jsonInit(this.definition());
    },
    definition(){
        return {
            message0       : translate('Ticks List'),
            output         : 'Array',
            outputShape    : Blockly.OUTPUT_SHAPE_ROUND,
            colour         : Blockly.Colours.Binary.colour,
            colourSecondary: Blockly.Colours.Binary.colourSecondary,
            colourTertiary : Blockly.Colours.Binary.colourTertiary,
            tooltip        : translate('Returns the list of tick values'),
            category       : Blockly.Categories.Tick_Analysis,
        };
    },
    meta(){
        return {
            'display_name': translate('Tick List'),
            'description' : translate('Tick List Description'),
        };
    },
    onchange(event) {
        if (!this.workspace || this.isInFlyout || this.workspace.isDragging()) {
            return;
        }

        if (event.type === Blockly.Events.END_DRAG) {
            const allowedScopes = [
                'trade_definition',
                'during_purchase',
                'before_purchase',
                'after_purchase',
                'tick_analysis',
            ];
            if (allowedScopes.some(scope => this.isDescendantOf(scope))) {
                if (this.disabled) {
                    this.setDisabled(false);
                }
            } else if (!this.disabled) {
                this.setDisabled(true);
            }
        }
    },
};

Blockly.JavaScript.ticks = () => ['Bot.getTicks()', Blockly.JavaScript.ORDER_ATOMIC];
