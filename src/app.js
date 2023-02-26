App = {
    loading: false,
    contracts: {},
    load: async () => {
        // Load app...
        console.log("App loading")
        await App.loadWeb3()
        await App.loadAccount()
        await App.loadContract()
        await App.render()
        web3.eth.defaultAccount = App.account;
    },
    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    loadWeb3: async () => {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider
            web3 = new Web3(web3.currentProvider)
        } else {
            window.alert("Please connect to Metamask.")
        }
        // Modern dapp browsers...
        if (window.ethereum) {
            window.web3 = new Web3(ethereum)
            try {
                // Request account access if needed
                await ethereum.enable()
                // Acccounts now exposed
                web3.eth.sendTransaction({/* ... */})
            } catch (error) {
                // User denied account access...
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = web3.currentProvider
            window.web3 = new Web3(web3.currentProvider)
            // Acccounts always exposed
            web3.eth.sendTransaction({/* ... */})
        }
        // Non-dapp browsers...
        else {
            console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
        }
    },

    loadAccount: async () => {
        App.account = web3.eth.accounts[0]
        console.log(App.account)
    },

    loadContract: async () => {
        const todoList = await $.getJSON("ToDoList.json")
        App.contracts.ToDoList = TruffleContract(todoList)
        App.contracts.ToDoList.setProvider(App.web3Provider)

        App.toDoList = await App.contracts.ToDoList.deployed()
    },

    render: async () => {
        if (App.loading) {
            return
        }

        App.setLoading(true)

        $("#account").html(App.account)

        await App.renderTasks()

        App.setLoading(false)

    },

    createTask: async () => {
        App.setLoading(true)
        const content = $('#newTask').val()
        await App.toDoList.createTask(content)
        window.location.reload()
    },

    toggleCompleted: async (event) => {
        App.setLoading(true)
        const taskId = event.target.name
        await App.toDoList.toggleCompleted(taskId)
        window.location.reload()
    },

    renderTasks: async () => {
        // Load the total task count from the blockchain
        const taskCount = await App.toDoList.taskCount();
        const $taskTemplate = $('.taskTemplate');
        // const temp = await App.toDoList.tasks

        // Render tasks
        for (var i = 1; i <= taskCount; i++) {

            const task = await App.toDoList.tasks(i);
            const taskId = task[0].toNumber()
            const taskContent = task[1];
            const taskCompleted = task[2]

            const $newTaskTemplate = $taskTemplate.clone()
            $newTaskTemplate.find('.content').html(taskContent)
            $newTaskTemplate.find('input')
                .prop('name', taskId)
                .prop('checked', taskCompleted)
                .on('click', App.toggleCompleted)

            if (taskCompleted) {
                $('#completedTaskList').append($newTaskTemplate)
            } else {
                $('#taskList').append($newTaskTemplate)
            }

            $newTaskTemplate.show()
        }
    },

    setLoading: (boolean) => {
        App.loading = boolean
        const loader = $('#loader')
        const content = $('#content')
        if (boolean) {
            loader.show()
            content.hide()
        } else {
            loader.hide()
            content.show()
        }
    }

}

$(() => {
    $(window).load(() => {
        App.load()
    })
})
