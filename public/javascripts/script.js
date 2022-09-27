// const { default: Swal } = require("sweetalert2")



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
                Swal.fire({
                    position:'top-center',
                    icon:'success',
                    title:'Item has been Added',
                    showConfirmButton:false,
                    timer:1000
                })
                let count = $('#wish_count').html()
                console.log(count)
                count = parseInt(count)+1
                $('#wish_count').html(count)
            }else{
                Swal.fire({
                    icon:'warning',
                    text:'Already Exist in Your Wishlist'
                })
            }
        }
    })
}

function removeWishlistProduct(prodId,wishlistId){
        
    Swal.fire({
        title:'Are you sure?',
        text:"You won't be able to revert this!",
        width: 700,
        
        icon:'warning',
        showCancelButton:true,
        confirmButtonColor:'#3085d6',
        cancelButtonColor:'#d33',
        confirmButtonText:'Yes,delete it!'
    }).then((result)=>{
        if(result.isConfirmed){
            $.ajax({
        url:'/remove-wishlist-product',
        data:{
            prodId:prodId,
            wishlistId:wishlistId
        },
        method:'post',
        success:(response)=>{
            if(response.removeProduct){
                Swal.fire('Deleted!','Your file has been deleted.','success')
               .then(()=>{
               
               location.reload()
               })
            }
        }
    })
        }
    })
    
}