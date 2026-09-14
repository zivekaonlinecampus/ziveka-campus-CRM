<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('representatives', function (Blueprint $table) {
            $table->string('nic_copy_path')->nullable()->after('nic_passport');
            $table->string('signed_agreement_path')->nullable()->after('nic_copy_path');
        });
    }

    public function down(): void
    {
        Schema::table('representatives', function (Blueprint $table) {
            $table->dropColumn(['nic_copy_path', 'signed_agreement_path']);
        });
    }
};
