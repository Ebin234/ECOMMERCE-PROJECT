

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

function addToWishlist(prodId){
    $.ajax({
        url:'/add-to-wishlist/'+prodId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count = $('#wish_count').html()
                console.log(count)
                count = parseInt(count)+1
                $('#wish_count').html(count)
            }
        }
    })
}