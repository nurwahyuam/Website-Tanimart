<?php

namespace App\Models;

use App\Models\Product;
use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    protected $fillable = [
        'product_id',
        'image_product_url'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
