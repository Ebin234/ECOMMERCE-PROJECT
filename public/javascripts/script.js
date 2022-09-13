function addToCart(prodId){
    $.ajax({
        url:'/add-to-cart/'+ prodId,
        method:'get',
        success:(response)=>{
            //alert(response)
            if(response.status){
                let count = $('#cart_count').html()
                console.log(count)
                count = parseInt(count)+1
                $("#cart_count").html(count)
            }
        }
    })
}