import { getPurchaseChoices } from '../../../shared';
import { translate }         from '../../../../utils/lang/i18n';

Blockly.Blocks.payout = {
    init() {
        this.jsonInit(this.definition());
    },
    definition(){
        return {
            message0: translate('Payout %1'),
            args0   : [
                {
                    type   : 'field_dropdown',
                    name   : 'PURCHASE_LIST',
                    options: getPurchaseChoices,
                },
            ],
            output         : 'Number',
            outputShape    : Blockly.OUTPUT_SHAPE_ROUND,
            colour         : Blockly.Colours.Binary.colour,
            colourSecondary: Blockly.Colours.Binary.colourSecondary,
            colourTertiary : Blockly.Colours.Binary.colourTertiary,
            tooltip        : translate('Payout for selected proposal'),
            category       : Blockly.Categories.Before_Purchase,
        };
    },
    meta(){
        return {
            'display_name': translate('Payout'),
            'description' : translate('Payout Description'),
        };
    },
    onchange(event) {
        if (!this.workspace || this.isInFlyout || this.workspace.isDragging()) {
            return;
        }

        if (event.type === Blockly.Events.END_DRAG) {
            if (this.isDescendantOf('before_purchase')) {
                if (this.disabled) {
                    this.setDisabled(false);
                }
            } else if (!this.disabled) {
                this.setDisabled(true);
            }
        }
    },
};

Blockly.JavaScript.payout = block => {
    const purchaseList = block.getFieldValue('PURCHASE_LIST');

    const code = `Bot.getPayout('${purchaseList}')`;
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
};
