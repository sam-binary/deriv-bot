import { observable, action, computed } from 'mobx';

export default class TutorialStore {
    @observable showAgain = true;
    @observable modalIsOpen = true;
    @observable strategy = 'martingale';
    @observable tradeOptions = {
        market  : 'm1',
        contract: 'c1',
        stake   : 0,
        size    : 0,
        loss    : 0,
        profit  : 0,
    };

    constructor() {
        this.showAgain = localStorage.getItem('StarterHint') === 'true';
        this.modalIsOpen = this.showAgain;
    }

    changeStrategy = async () => {
        const workspace = Blockly.mainWorkspace;
        const strategy_xml = await fetch(`dist/${this.strategy}.xml`).then(response => response.text());
        const strategy_dom = Blockly.Xml.textToDom(strategy_xml);

        const modifiedValueBlock = type => {
            const valueBlock = strategy_dom.querySelectorAll(`value[id="${type}_value"]`)[0];
            valueBlock.innerHTML = `<block type="math_number"><field name="NUM">${this.tradeOptions[type]}</field></block>`;
        };

        const modifiedValue = (name, type) => {
            const block = strategy_dom.querySelectorAll(`field[name="${name}"]`);
            block[0].innerHTML = this.tradeOptions[type];
        };

        modifiedValue('MARKET_LIST', 'market');
        modifiedValue('TYPE_LIST', 'contract');

        modifiedValueBlock('stake');
        modifiedValueBlock('size');
        modifiedValueBlock('loss');
        modifiedValueBlock('profit');

        workspace.clear();
        Blockly.Xml.domToWorkspace(strategy_dom, workspace);
    }

    @computed
    get tradeOptionValue() {
        return this.tradeOptions;
    }

    @computed
    get modalOpen() {
        return this.modalIsOpen;
    }

    @action.bound
    closeModal = () => {
        this.modalIsOpen = !this.modalIsOpen;
    };

    @action.bound
    setTradeOption = (name, value) => {
        this.tradeOptions[name] = value;
    };

    @action.bound
    setShowAgain = showAgain => {
        this.showAgain = showAgain;
        localStorage.setItem('StarterHint', !this.showAgain);
    }

    @action.bound
    setStrategy = strategy => {
        this.strategy = strategy;
    }

    @action.bound
    handleSubmit = e => {
        e.preventDefault();
        this.modalIsOpen = !this.modalIsOpen;

        this.changeStrategy();
    };

}
