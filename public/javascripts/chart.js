const ctx = document.getElementById('myChart').getContext('2d');
const earnings = document.getElementById('earnings').getContext('2d');
var myChart = new Chart(ctx, {
    type: 'polarArea',
    data: {
        labels: ['Red', 'Blue', 'Yellow'],
        datasets: [{
            label: 'Trafic Source',
            data: [{{ totalCodRevenue}}],
            backgroundColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)'
                // 'rgba(75, 192, 192, 0.2)',
                // 'rgba(153, 102, 255, 0.2)',
                // 'rgba(255, 159, 64, 0.2)'
            ],
            // borderColor: [
            //     'rgba(255, 99, 132, 1)',
            //     'rgba(54, 162, 235, 1)',
            //     'rgba(255, 206, 86, 1)'
            //     // 'rgba(75, 192, 192, 1)',
            //     // 'rgba(153, 102, 255, 1)',
            //     // 'rgba(255, 159, 64, 1)'
            // ],
            // borderWidth: 1
        }]
    },
    options: {
        responsive: true,
    }
});


var myChart = new Chart(earnings, {
    type: 'bar',
    data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        datasets: [{
            label: '# of Votes',
            data: [1200, 1990, 39098, 5656, 27686, 34664, 5454, 5555, 2323, 56756, 12332, 33332, 21222],
            backgroundColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 0.2)',


                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 0.2)'
            ],
            // borderColor: [
            //     'rgba(255, 99, 132, 1)',
            //     'rgba(54, 162, 235, 1)',
            //     'rgba(255, 206, 86, 1)',
            //     'rgba(75, 192, 192, 1)',
            //     'rgba(153, 102, 255, 1)',
            //     'rgba(255, 159, 64, 1)'
            // ],
            // borderWidth: 1
        }]
    },
    options: {
        responsive:true,
        // scales: {
        //     y: {
        //         beginAtZero: true
        //     }
        // }
    }
});