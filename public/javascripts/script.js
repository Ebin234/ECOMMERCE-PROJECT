// const { default: Swal } = require("sweetalert2")

// const { response } = require("../../app")

// const { response } = require("../../app")



function addToCart(prodId, userId) {
    $.ajax({
        url: '/add-to-cart/' + prodId,
        method: 'get',
        success: (response) => {
            // alert(response)
            if (response.cartAdded) {
                let count = $('#cart_count').html()
                console.log("count", count)
                count = parseInt(count) + 1
                $("#cart_count").html(count)
            }else{
                location.href='/login'
            }
        }
    })
}

function addToWishlist(prodId) {
    $.ajax({
        url: '/add-to-wishlist/' + prodId,
        method: 'get',
        success: (response) => {
            // alert(response)
            if(response.prodNotAdded){
                location.href='/login'
            }
            else if (response.status) {
                Swal.fire({
                    position: 'top-center',
                    icon: 'success',
                    title: 'Item has been Added',
                    showConfirmButton: false,
                    timer: 1000
                })
                let count = $('#wish_count').html()
                console.log(count)
                count = parseInt(count) + 1
                $('#wish_count').html(count)
            } else {
                Swal.fire({
                    icon: 'warning',
                    text: 'Already Exist in Your Wishlist'
                })
            }
        }
    })
}

function removeWishlistProduct(prodId, wishlistId) {

    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        width: 700,

        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes,delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/remove-wishlist-product',
                data: {
                    prodId: prodId,
                    wishlistId: wishlistId
                },
                method: 'post',
                success: (response) => {
                    if (response.removeProduct) {
                        Swal.fire('Deleted!', 'Your file has been deleted.', 'success')
                            .then(() => {

                                location.reload()
                            })
                    }
                }
            })
        }
    })

}

function addCategory() {

    // const ipAPI = 'http://localhost:3000/admin/add-category';


    const inputValue = null

    // fetch(ipAPI)
    //     .then(response => response.json())
    //     .then(data => data.result)

    Swal.fire({
        title: 'Enter Category Name',
        input: 'text',
        inputLabel: 'Category Name',
        inputValue: inputValue,
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) {
                return 'You need to write something!'
            }
        }
    }).then((result) => {
        if (result.value) {
            Swal.fire({
                title: `${result.value} `,
                text: 'Category Added Successfully'
            }).then(() => {
                $.ajax({
                    url: '/admin/add-category',
                    data: {
                        category: result.value
                    },
                    method: 'post',
                    success: (response) => {
                        if (response.added) {
                            location.href = '/admin/view-categories'
                        }
                    }
                })
            })
        }
    })

}

function editCategory(catId) {
    console.log(catId)
    const ipAPI = 'http://localhost:3000/admin/edit-category/' + catId


    const inputValue = fetch(ipAPI)
        .then(response => response.json())
        .then(data => data)



    Swal.fire({
        title: 'Edit Category Name',
        input: 'text',
        inputLabel: 'Category Name',
        inputValue: inputValue,
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) {
                return 'You need to write something!'
            }
        }
    }).then((result) => {
        if (result.value) {
            Swal.fire({
                title: `${result.value} `,
                text: 'Category Added Successfully'
            }).then(() => {
                $.ajax({
                    url: '/admin/edit-category',
                    data: {
                        newCategory: result.value,
                        catId: catId
                    },
                    method: 'post',
                    success: (response) => {
                        if (response.updated) {
                            location.reload()
                        }
                    }
                })
            })
        }
    })
}

function addBrand() {

    // const ipAPI = 'http://localhost:3000/admin/add-category';


    const inputValue = null

    // fetch(ipAPI)
    //     .then(response => response.json())
    //     .then(data => data.result)

    Swal.fire({
        title: 'Enter Brand Name',
        input: 'text',
        inputLabel: 'Barnd Name',
        inputValue: inputValue,
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) {
                return 'You need to write something!'
            }
        }
    }).then((result) => {
        if (result.value) {
            Swal.fire({
                title: `${result.value} `,
                text: 'Added Successfully'
            }).then(() => {
                $.ajax({
                    url: '/admin/add-brand',
                    data: {
                        brand: result.value
                    },
                    method: 'post',
                    success: (response) => {
                        if (response.brand) {
                            location.href = '/admin/view-brands'
                        }
                    }
                })
            })
        }
    })

}


function editBrand(brandId) {
    console.log(brandId)
    const ipAPI = 'http://localhost:3000/admin/edit-brand/' + brandId


    const inputValue = fetch(ipAPI)
        .then(response => response.json())
        .then(data => data)



    Swal.fire({
        title: 'Edit Brand Name',
        input: 'text',
        inputLabel: 'Brand Name',
        inputValue: inputValue,
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) {
                return 'You need to write something!'
            }
        }
    }).then((result) => {
        if (result.value) {
            Swal.fire({
                title: `${result.value} `,
                text: 'Added Successfully'
            }).then(() => {
                $.ajax({
                    url: '/admin/edit-brand',
                    data: {
                        newBrand: result.value,
                        brandId: brandId
                    },
                    method: 'post',
                    success: (response) => {
                        if (response.brandUpdated) {
                            location.reload()
                        }
                    }
                })
            })
        }
    })
}

